#!/bin/bash

echo "🔍 Mengambil data dari MariaDB & memeriksa duplikat..."

NODE_PATH=$(pwd)/node_modules node -e '
const prisma = require("./src/config/prisma");

async function checkDuplicates() {
    try {
        const students = await prisma.student.findMany();
        const groupMap = new Map();

        for (const student of students) {
            const namaBersih = (student.nama || "").toLowerCase().trim();
            const nimBersih = (student.nim || "").toLowerCase().trim().replace(/x/g, "");
            const key = `${namaBersih}_${nimBersih}`;

            if (!groupMap.has(key)) {
                groupMap.set(key, []);
            }
            groupMap.get(key).push({ nama: student.nama, nim: student.nim });
        }

        const duplicates = [];
        for (const [key, group] of groupMap) {
            if (group.length > 1) {
                duplicates.push(...group);
            }
        }

        console.log("======================================");
        console.log(`DAFTAR MAHASISWA DUPLIKAT DITEMUKAN PADA MARIADB (${duplicates.length} item):`);
        console.log(JSON.stringify(duplicates, null, 2));
    } catch (e) {
        console.error("Gagal memeriksa database:", e.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkDuplicates();
'
