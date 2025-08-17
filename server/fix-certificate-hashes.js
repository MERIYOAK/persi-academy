const mongoose = require('mongoose');
const Certificate = require('./models/Certificate');

async function fixCertificateHashes() {
  try {
    // Connect to remote MongoDB Atlas database
    await mongoose.connect('mongodb+srv://meron:07448717@persi-edu-platform.giuvi3i.mongodb.net/?retryWrites=true&w=majority&appName=persi-edu-platform');
    console.log('Connected to remote MongoDB Atlas database');

    // Get all certificates
    const certificates = await Certificate.find({});
    console.log(`Found ${certificates.length} certificates`);

    for (const certificate of certificates) {
      console.log(`Processing certificate: ${certificate.certificateId}`);
      
      // Generate new hash with the fixed method
      const newHash = certificate.generateVerificationHash();
      const oldHash = certificate.verificationHash;
      
      console.log(`Old hash: ${oldHash}`);
      console.log(`New hash: ${newHash}`);
      console.log(`Hashes match: ${oldHash === newHash}`);
      
      // Update the verification hash
      certificate.verificationHash = newHash;
      await certificate.save();
      
      console.log(`Updated certificate: ${certificate.certificateId}`);
      console.log('---');
    }

    console.log('All certificate hashes have been updated!');
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    await mongoose.connection.close();
  }
}

fixCertificateHashes();
