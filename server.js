import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import axios from 'axios';
import bodyParser from 'body-parser';

// Load environment variables
dotenv.config();

// Validate environment variables
const requiredEnvVars = ['JWT_SECRET', 'MPESA_CONSUMER_KEY', 'MPESA_CONSUMER_SECRET', 'MPESA_SHORTCODE', 'MPESA_PASSKEY', 'MPESA_CALLBACK_URL'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  console.warn(`Warning: Missing environment variables: ${missingEnvVars.join(', ')}. Some features (e.g., M-Pesa, JWT) may not work.`);
  console.warn('Please create a .env file with the required variables.');
}

// Fix __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'temporary_jwt_secret'; // Fallback for development
const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE;
const MPESA_PASSKEY = process.env.MPESA_PASSKEY;
const MPESA_CALLBACK_URL = process.env.MPESA_CALLBACK_URL;

// Middleware
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// LowDB setup
const adapter = new JSONFile('db.json');
const defaultData = {
  users: [],
  bookings: [],
  jobs: [],
  examples: [],
  transactions: [],
};
const db = new Low(adapter, defaultData);

// Initialize database
async function initializeDb() {
  try {
    await db.read();
    db.data ||= defaultData;
    await db.write();
  } catch (error) {
    console.error('Error initializing database:', error);
    db.data = defaultData;
    await db.write();
  }
}

// JWT verification middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (error) {
    const errorMessage = error.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    res.status(401).json({ error: errorMessage });
  }
};

// M-Pesa token generation
async function getMpesaToken() {
  if (!MPESA_CONSUMER_KEY || !MPESA_CONSUMER_SECRET) {
    throw new Error('M-Pesa credentials missing in .env');
  }
  const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64');
  try {
    const response = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      headers: { Authorization: `Basic ${auth}` },
    });
    return response.data.access_token;
  } catch (error) {
    throw new Error(`Failed to generate M-Pesa token: ${error.message}`);
  }
}

// Routes

// Register User
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    await db.read();
    if (db.data.users.find((u) => u.email === email)) {
      return res.status(400).json({ error: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      id: db.data.users.length + 1,
      name,
      email,
      password: hashedPassword,
      role: role || 'user',
      walletBalance: 1500,
      mpesaLinked: true,
      notifications: [],
      messages: [],
      bookings: 0,
      earnings: 0,
      skills: [],
    };
    db.data.users.push(user);
    await db.write();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login User
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    await db.read();
    const user = db.data.users.find((u) => u.email === email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      redirect: '/dashboard.html',
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Verify Token
app.get('/api/login', verifyToken, async (req, res) => {
  try {
    await db.read();
    const user = db.data.users.find((u) => u.id === req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// User Data
app.get('/api/user', verifyToken, async (req, res) => {
  try {
    await db.read();
    const user = db.data.users.find((u) => u.id === req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      name: user.name,
      role: user.role,
      walletBalance: user.walletBalance || 1500,
      mpesaLinked: user.mpesaLinked || true,
      notifications: user.notifications?.slice(0, 3) || [],
      messages: user.messages?.slice(0, 3) || [],
      bookings: user.bookings || 0,
      earnings: user.earnings || 0,
      skills: user.skills || [],
    });
  } catch (error) {
    console.error('User data error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin Dashboard Data
app.get('/api/admin/dashboard', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });
    await db.read();
    res.json({
      userCount: db.data.users.length,
      bookingCount: db.data.bookings.length,
      jobCount: db.data.jobs.length,
      recentBookings: db.data.bookings.slice(-5),
      recentJobs: db.data.jobs.slice(-5),
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin Stats
app.get('/api/stats', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });
    await db.read();
    res.json({
      users: db.data.users.length,
      bookings: db.data.bookings.length,
      jobs: db.data.jobs.length,
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// User Dashboard Data
app.get('/api/user/:id/dashboard', verifyToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    await db.read();
    const user = db.data.users.find((u) => u.id === userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const userBookings = db.data.bookings.filter((b) => b.userId === userId);
    const userJobs = db.data.jobs.filter((j) => j.postedBy === userId);
    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      stats: {
        applications: userBookings.length,
        postedJobs: userJobs.length,
        completedJobs: userBookings.filter((b) => b.status === 'completed').length,
      },
      recentJobs: db.data.jobs.slice(0, 3),
    });
  } catch (error) {
    console.error('User dashboard error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create Job Posting
app.post('/api/jobs', verifyToken, async (req, res) => {
  try {
    const { title, description, category, location, pay } = req.body;
    if (!title || !description || !category || !location || !pay) {
      return res.status(400).json({ error: 'Title, description, category, location, and pay are required' });
    }
    await db.read();
    const job = {
      id: db.data.jobs.length + 1,
      postedBy: req.user.id,
      title,
      description,
      category,
      location,
      pay,
      createdAt: new Date().toISOString(),
    };
    db.data.jobs.push(job);
    await db.write();
    res.status(201).json({ message: 'Job posted', job });
  } catch (error) {
    console.error('Job posting error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create Booking with M-Pesa Payment
app.post('/api/bookings', verifyToken, async (req, res) => {
  try {
    const { service, provider, jobId, phoneNumber, amount } = req.body;
    if (!service || !provider || !jobId || !phoneNumber || !amount) {
      return res.status(400).json({ error: 'Service, provider, jobId, phone number, and amount are required' });
    }
    await db.read();
    const job = db.data.jobs.find((j) => j.id === parseInt(jobId));
    if (!job) return res.status(404).json({ error: 'Job not found' });

    // Initiate M-Pesa STK Push
    const token = await getMpesaToken();
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString('base64');
    const stkResponse = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        BusinessShortCode: MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: phoneNumber,
        PartyB: MPESA_SHORTCODE,
        PhoneNumber: phoneNumber,
        CallBackURL: MPESA_CALLBACK_URL,
        AccountReference: `Job-${jobId}`,
        TransactionDesc: `Payment for Job ${jobId}`,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Store pending booking
    const booking = {
      id: db.data.bookings.length + 1,
      userId: req.user.id,
      service,
      provider,
      jobId: parseInt(jobId),
      phoneNumber,
      amount,
      status: 'pending',
      mpesaRequestId: stkResponse.data.CheckoutRequestID,
      createdAt: new Date().toISOString(),
    };
    db.data.bookings.push(booking);
    await db.write();

    res.status(201).json({ message: 'STK Push initiated, please check your phone to complete payment', booking });
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ error: 'Failed to initiate payment' });
  }
});

// M-Pesa Callback
app.post('/api/mpesa/callback', async (req, res) => {
  try {
    const { Body } = req.body;
    if (!Body || !Body.stkCallback) {
      return res.status(400).json({ error: 'Invalid callback data' });
    }
    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = Body.stkCallback;

    await db.read();
    const booking = db.data.bookings.find((b) => b.mpesaRequestId === CheckoutRequestID);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const transaction = {
      id: db.data.transactions.length + 1,
      checkoutRequestID: CheckoutRequestID,
      resultCode: ResultCode,
      resultDesc: ResultDesc,
      amount: CallbackMetadata?.Item.find((i) => i.Name === 'Amount')?.Value || 0,
      mpesaReceiptNumber: CallbackMetadata?.Item.find((i) => i.Name === 'MpesaReceiptNumber')?.Value || '',
      transactionDate: CallbackMetadata?.Item.find((i) => i.Name === 'TransactionDate')?.Value || '',
      phoneNumber: CallbackMetadata?.Item.find((i) => i.Name === 'PhoneNumber')?.Value || '',
      createdAt: new Date().toISOString(),
    };

    booking.status = ResultCode === 0 ? 'completed' : 'failed';
    db.data.transactions.push(transaction);
    await db.write();

    res.status(200).json({ status: 'Processed' });
  } catch (error) {
    console.error('Callback error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Example Endpoints
app.get('/api/example', async (req, res) => {
  try {
    await db.read();
    res.json(db.data.examples);
  } catch (error) {
    console.error('Example GET error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/example', async (req, res) => {
  try {
    const data = req.body;
    if (!Object.keys(data).length) return res.status(400).json({ error: 'Request body is required' });
    await db.read();
    const example = { id: db.data.examples.length + 1, ...data, createdAt: new Date().toISOString() };
    db.data.examples.push(example);
    await db.write();
    res.status(201).json({ message: 'Example created', data: example });
  } catch (error) {
    console.error('Example POST error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Serve HTML Pages
app.get('/pages/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', req.path), (err) => {
    if (err) {
      console.error(`Error serving file: ${err}`);
      res.status(404).json({ error: 'Page not found' });
    }
  });
});

// Serve Homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'connect.html'));
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start Server
async function startServer() {
  await initializeDb();
  app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
  });
}

startServer();