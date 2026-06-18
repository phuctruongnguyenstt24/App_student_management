const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const User = require('../models/User');

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const adminExists = await User.findOne({ role: 'admin' });

        if (adminExists) {
            console.log('Admin account already exists');
            process.exit();
        }

        const admin = await User.create({
            fullName: 'Quản trị viên',
            studentId: 'ADMIN001',
            email: 'ntphucktpm2311047@student.ctuet.edu.vn',
            password: 'phucktpm2311047',
            role: 'admin'
        });

        console.log('Admin account created successfully!');


        process.exit();
    } catch (error) {
        console.error('Error creating admin:', error);
        process.exit(1);
    }
};

createAdmin();