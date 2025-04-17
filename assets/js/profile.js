document.addEventListener('DOMContentLoaded', () => {
    // Commission Model (10% platform fee)
    function calculateCommission(jobAmount) {
        const commissionRate = 0.1; // 10%
        const commission = jobAmount * commissionRate;
        const workerEarns = jobAmount - commission;
        return { commission, workerEarns };
    }

    // Mock job calculation
    const jobAmount = 1000; // Example: KES 1,000 job
    const { commission, workerEarns } = calculateCommission(jobAmount);
    console.log(`Job: KES ${jobAmount}, Platform Fee: KES ${commission}, Worker Earns: KES ${workerEarns}`);

    // Deposit Button (Mock M-Pesa)
    const depositBtn = document.getElementById('deposit-btn');
    if (depositBtn) {
        depositBtn.addEventListener('click', () => {
            const amount = prompt('Enter amount to deposit via M-Pesa (KES):');
            if (amount && !isNaN(amount) && amount > 0) {
                alert(`Processing KES ${amount} deposit via M-Pesa...`);
                const balanceElement = document.getElementById('wallet-balance');
                const currentBalance = parseInt(balanceElement.textContent.replace('KES ', '').replace(',', '')) || 0;
                const newBalance = currentBalance + parseInt(amount);
                balanceElement.textContent = `KES ${newBalance.toLocaleString()}`;
            } else {
                alert('Please enter a valid amount.');
            }
        });
    }

    // Edit Profile Form
    const editProfileForm = document.getElementById('edit-profile-form');
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('profile-name').value;
            const city = document.getElementById('profile-city').value;
            const bio = document.getElementById('profile-bio').value;
            const skills = Array.from(document.querySelectorAll('input[name="skills"]:checked')).map(input => input.value);
            const avatar = document.getElementById('profile-avatar').files[0];

            if (!name.trim()) {
                alert('Please enter your name.');
                return;
            }
            if (!skills.length) {
                alert('Please select at least one skill.');
                return;
            }
            if (avatar && avatar.size > 2 * 1024 * 1024) {
                alert('Profile picture must be less than 2MB.');
                return;
            }

            alert(`Profile updated successfully!\nName: ${name}\nCity: ${city}\nBio: ${bio}\nSkills: ${skills.join(', ')}`);
            window.location.href = 'pages/profile.html';
        });
    }

    // Verification Form
    const verifyForm = document.getElementById('verify-form');
    if (verifyForm) {
        verifyForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const idType = document.getElementById('id-type').value;
            const idNumber = document.getElementById('id-number').value;
            const idFront = document.getElementById('id-front').files[0];
            const idBack = document.getElementById('id-back').files[0];

            if (!idNumber.trim()) {
                alert('Please enter your ID number.');
                return;
            }
            if (!idFront) {
                alert('Please upload the front of your ID.');
                return;
            }
            if (idFront.size > 5 * 1024 * 1024 || (idBack && idBack.size > 5 * 1024 * 1024)) {
                alert('Document files must be less than 5MB.');
                return;
            }

            alert(`Verification submitted!\nID Type: ${idType}\nID Number: ${idNumber}\nDocuments uploaded successfully.`);
            window.location.href = 'pages/profile.html';
        });
    }
});