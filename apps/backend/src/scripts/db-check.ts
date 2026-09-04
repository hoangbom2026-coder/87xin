import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const dbCheck = async () => {
    try {
        const mongoUrl = process.env.DATABASE_URL;
        if (!mongoUrl) {
            console.error('DATABASE_URL not found in .env');
            process.exit(1);
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUrl);
        console.log('Connected.');

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('\n--- Collections ---');
        for (const col of collections) {
            const count = await mongoose.connection.db.collection(col.name).countDocuments();
            console.log(`${col.name}: ${count} documents`);
        }

        console.log('\n--- Database Stats ---');
        const stats = await mongoose.connection.db.stats();
        console.log(`Database: ${stats.db}`);
        console.log(`Size on disk: ${(stats.fsTotalSize / 1024 / 1024 / 1024).toFixed(2)} GB`);
        console.log(`Data size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);

        await mongoose.disconnect();
        console.log('\nDisconnected.');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

dbCheck();
