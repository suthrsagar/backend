import prisma from '../config/db.js';

const getTodayAtTime = (hours, minutes) => {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
};

const getFutureDateOffset = (days, hours, minutes) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hours, minutes, 0, 0);
  return d;
};

const getPastDateOffset = (days, hours, minutes) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hours, minutes, 0, 0);
  return d;
};

export const seedUserData = async (userId) => {
  try {
    console.log(`[Seeder] Seeding database for new user ${userId}...`);

    // 1. Create Clients
    const client1 = await prisma.client.create({
      data: {
        userId,
        name: 'Mukesh G. Mehta',
        phone: '+91 98201 12345',
        email: 'mukesh.mehta@mehtaestates.in',
        address: 'Chander Mukhi Building, Nariman Point, Mumbai, MH - 400021',
      }
    });

    const client2 = await prisma.client.create({
      data: {
        userId,
        name: 'Srimati Asha Devi',
        phone: '+91 98110 54321',
        email: 'ashadevi.family@gmail.com',
        address: 'B-24, Green Park Extension, New Delhi - 110016',
      }
    });

    const client3 = await prisma.client.create({
      data: {
        userId,
        name: 'Rahul R. Gupta',
        phone: '+91 98920 98765',
        email: 'rahul.gupta@guptalogistics.com',
        address: '12, Alkapuri Executive Society, Vadodara, GJ - 390007',
      }
    });

    const client4 = await prisma.client.create({
      data: {
        userId,
        name: 'Dr. Vikram Sen',
        phone: '+91 97690 11223',
        email: 'dr.vsen@vashiclinic.co.in',
        address: 'Plot 88, Sector 17, Vashi, Navi Mumbai - 400703',
      }
    });

    // 2. Create Cases
    const case1 = await prisma.case.create({
      data: {
        userId,
        clientId: client1.id,
        caseNumber: 'W.P.(C) No. 4021/2024',
        title: 'Mehta Estates vs. Municipal Corporation of Delhi',
        description: 'Writ Petition under Article 226 challenging illegal demolition notice issued under Section 343 of Delhi Municipal Corporation (DMC) Act.',
        courtName: 'High Court of Delhi - Civil Writ Bench (Court 14)',
        judgeName: 'Hon\'ble Mr. Justice Sanjeev Sachdeva',
        caseType: 'Constitutional / Writ Petition',
        status: 'ACTIVE',
      }
    });

    const case2 = await prisma.case.create({
      data: {
        userId,
        clientId: client2.id,
        caseNumber: 'C.S.(OS) No. 904/2023',
        title: 'Smt. Asha Devi vs. Ram Swaroop & Ors.',
        description: 'Partition suit seeking 1/3rd share of joint family ancestral residential property and agricultural land in Mussoorie.',
        courtName: 'District Court Saket - Civil Judge Division (Court 3)',
        judgeName: 'Judge Amit Verma',
        caseType: 'Property Law / Partition Suit',
        status: 'ACTIVE',
      }
    });

    const case3 = await prisma.case.create({
      data: {
        userId,
        clientId: client3.id,
        caseNumber: 'Arb.P. No. 112/2025',
        title: 'Gupta Logistics vs. Bharat Freight Solutions',
        description: 'Petition under Section 11(6) of Arbitration and Conciliation Act, 1996 for appointment of a sole arbitrator in a commercial contract breach dispute.',
        courtName: 'High Court of Gujarat - Arbitration Division (Court 5)',
        judgeName: 'Hon\'ble Mr. Justice N. V. Anjaria',
        caseType: 'Commercial Law / Arbitration',
        status: 'PENDING',
      }
    });

    const case4 = await prisma.case.create({
      data: {
        userId,
        clientId: client4.id,
        caseNumber: 'R.C. No. 411/2022',
        title: 'Dr. Vikram Sen vs. Jagannath Builders & Developers',
        description: 'Rent Act eviction petition for non-payment of rent for commercial clinic suite in Sector 17, Vashi.',
        courtName: 'Small Causes Court, Mumbai (Bandra Bench)',
        judgeName: 'Judge S. K. Patil',
        caseType: 'Rent / Landlord Tenant Eviction',
        status: 'CLOSED',
      }
    });

    // 3. Create Hearings
    await prisma.hearing.createMany({
      data: [
        {
          caseId: case1.id,
          hearingDate: getTodayAtTime(10, 30),
          notes: 'Main arguments regarding MCD\'s lack of reasonable notice before sending demolition squads.',
          status: 'UPCOMING',
        },
        {
          caseId: case2.id,
          hearingDate: getFutureDateOffset(5, 11, 30),
          notes: 'PW-1 Smt. Asha Devi to stand for cross-examination by defense counsel.',
          status: 'UPCOMING',
        },
        {
          caseId: case3.id,
          hearingDate: getFutureDateOffset(11, 10, 30),
          notes: 'Verification of notice service on respondents. Reply filing check.',
          status: 'UPCOMING',
        }
      ]
    });

    // 4. Create Fees
    await prisma.fee.createMany({
      data: [
        {
          userId,
          clientId: client1.id,
          caseId: case1.id,
          amount: 150000,
          status: 'PAID',
          dueDate: getPastDateOffset(55, 0, 0),
          paidDate: getPastDateOffset(53, 0, 0),
          notes: 'Writ Drafting & Retainer fee paid.',
        },
        {
          userId,
          clientId: client1.id,
          caseId: case1.id,
          amount: 75000,
          status: 'PENDING',
          dueDate: getFutureDateOffset(10, 0, 0),
          notes: 'Appearance fee for admission arguments.',
        },
        {
          userId,
          clientId: client2.id,
          caseId: case2.id,
          amount: 100000,
          status: 'PARTIALLY_PAID',
          dueDate: getPastDateOffset(25, 0, 0),
          paidDate: getPastDateOffset(25, 0, 0),
          notes: 'Evidence stage preparation fee (₹60,000 paid, ₹40,000 pending).',
        },
        {
          userId,
          clientId: client3.id,
          caseId: case3.id,
          amount: 125000,
          status: 'PENDING',
          dueDate: getPastDateOffset(7, 0, 0),
          notes: 'Arbitration Filing & Notice Retainer.',
        },
        {
          userId,
          clientId: client4.id,
          caseId: case4.id,
          amount: 80000,
          status: 'PAID',
          dueDate: getPastDateOffset(35, 0, 0),
          paidDate: getPastDateOffset(35, 0, 0),
          notes: 'Final Arguments Trial Fee paid.',
        }
      ]
    });

    // 5. Create Notes
    await prisma.note.createMany({
      data: [
        {
          userId,
          caseId: case1.id,
          title: 'Stay Order Precedents',
          content: 'Refer to Delhi HC judgments on MCD demolition notices without mandatory 15-day notice period. Supreme Court rulings in Sudama Singh & Ors vs. Government of Delhi.'
        },
        {
          userId,
          caseId: case2.id,
          title: 'Evidence PW-1',
          content: 'Asha Devi has partition deed copy from 1984. Original property tax receipts from Mussoorie municipal registry.'
        }
      ]
    });

    console.log(`[Seeder] Seeded real legal diary database records for user ${userId} successfully.`);
    return true;
  } catch (error) {
    console.error(`[Seeder] Error seeding user data:`, error);
    return false;
  }
};
