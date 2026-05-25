
const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../../.env") });

async function seed() {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL not found");

    await mongoose.connect(url);
    console.log("Connected to database");

    const UserSchema = new mongoose.Schema({
        username: String,
        email: String,
        invitorId: mongoose.Schema.Types.ObjectId,
        path: [String],
        reagentEnrolled: Boolean,
        inviteCode: String,
        role: String,
        currency: String,
        status: String
    }, { timestamps: true });

    const UserModel = mongoose.models.users || mongoose.model('users', UserSchema);

    // 1. Find or Create hoangbom98
    let boss = await UserModel.findOne({ username: 'hoangbom98' });
    if (!boss) {
        boss = await UserModel.create({
            username: 'hoangbom98',
            email: 'hoangbom98@gmail.com',
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

    // 2. Create F1 Referrals
    const f1s = ['member_a', 'member_b', 'member_c'];
    for (const name of f1s) {
        let u = await UserModel.findOne({ username: name });
        if (!u) {
            u = await UserModel.create({
                username: name,
                email: `${name}@test.com`,
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
        if (name === 'member_a') {
            const f2s = ['sub_member_a1', 'sub_member_a2'];
            for (const subName of f2s) {
                let sub = await UserModel.findOne({ username: subName });
                if (!sub) {
                    await UserModel.create({
                        username: subName,
                        email: `${subName}@test.com`,
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
