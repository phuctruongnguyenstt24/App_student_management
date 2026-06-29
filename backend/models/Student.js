// models/Student.js
const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  studentId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  facultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true,
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
  },
  class: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  address: {
    type: String,
    trim: true,
  },
  dateOfBirth: {
    type: String,
    trim: true,
  },
  placeOfBirth: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  // Thông tin bổ sung
  academicInfo: {
    enrollmentDate: String,
    trainingLevel: String,
    trainingType: String,
    courseYear: String,
    base: String,
    profileCode: String,
  },
  personalInfo: {
    ethnicity: String,
    religion: String,
    nationality: String,
    region: String,
    cccd: String,
    cccdIssueDate: String,
    cccdIssuePlace: String,
    object: String,
    policyType: String,
    unionJoinDate: String,
    partyJoinDate: String,
    permanentResidence: String,
    bankName: String,
    bankBranch: String,
    accountHolder: String,
    accountNumber: String,
  },
  familyInfo: {
    father: {
      name: String,
      birthYear: String,
      occupation: String,
      nationality: String,
      ethnicity: String,
      religion: String,
      workplace: String,
      position: String,
      phone: String,
      permanentResidence: String,
      currentResidence: String,
    },
    mother: {
      name: String,
      birthYear: String,
      occupation: String,
      nationality: String,
      ethnicity: String,
      religion: String,
      workplace: String,
      position: String,
      phone: String,
      permanentResidence: String,
      currentResidence: String,
    },
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Student', studentSchema);