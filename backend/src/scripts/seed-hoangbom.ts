
import mongoose from "mongoose";
import path from "path";
import dotenv from "dotenv";
import UserModel from "../main/models/user.model";
import BalanceModel from "../main/models/balance.model";

dotenv.config({ path: path.join(__dirname, "../../.env") });

async function seed() {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL not found");

    await mongoose.connect(url);
    console.log("Connected to database");

    // 1. Find or Create hoangbom98
    let boss = await UserModel.findOne({ username: 'hoangbom98' });
    if (!boss) {
        boss = await UserModel.create({
            username: 'hoangbom98',
            email: 'hoangbom98@gmail.com',
            password: 'password123',
            role: 'player',
            currency: 'VND',
            status: 'active',
            reagentEnrolled: true,
            inviteCode: 'HB98'
        });
        console.log("Created boss hoangbom98");
    } else {
        boss.reagentEnrolled = true;
        boss.inviteCode = boss.inviteCode || 'HB98';
        await boss.save();
        console.log("Updated boss hoangbom98");
    }

    // Ensure balance exists
    let balance = await BalanceModel.findOne({ userId: boss._id });
    if (!balance) {
        await BalanceModel.create({
            userId: boss._id,
            amount: 5000000,
            currency: 'VND'
        });
        console.log("Created balance for hoangbom98");
    } else {
        balance.amount = Math.max(balance.amount, 5000000);
        await balance.save();
    }

    // 2. Create F1 Referrals
    const f1s = ['Member_A', 'Member_B', 'Member_C'];
    for (const name of f1s) {
        let u = await UserModel.findOne({ username: name.toLowerCase() });
        if (!u) {
            u = await UserModel.create({
                username: name.toLowerCase(),
                email: `${name.toLowerCase()}@test.com`,
                password: 'password123',
                role: 'player',
                currency: 'VND',
                status: 'active',
                invitorId: boss._id,
                path: [boss._id.toString()]
            });
            console.log(`Created F1: ${name}`);
        } else {
            u.invitorId = boss._id;
            u.path = [boss._id.toString()];
            await u.save();
        }

        // 3. Create F2 for Member_A
        if (name === 'Member_A') {
            const f2s = ['Sub_Member_A1', 'Sub_Member_A2'];
            for (const subName of f2s) {
                let sub = await UserModel.findOne({ username: subName.toLowerCase() });
                if (!sub) {
                    await UserModel.create({
                        username: subName.toLowerCase(),
                        email: `${subName.toLowerCase()}@test.com`,
                        password: 'password123',
                        role: 'player',
                        currency: 'VND',
                        status: 'active',
                        invitorId: u._id,
                        path: [boss._id.toString(), u._id.toString()]
                    });
                    console.log(`Created F2: ${subName}`);
                }
            }
        }
    }

    console.log("Seeding complete!");
    await mongoose.disconnect();
}

seed().catch(err => {
    console.error(err);
    process.exit(1);
});
