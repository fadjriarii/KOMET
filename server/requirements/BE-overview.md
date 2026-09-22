perbaiki struktur kalimat di bawah ini
saya ingin membuat sebuah penjelasan agar ai dapat memahami project backend yang ingin saya bangun berdasarkan gambaran frontend yang akan saya bangun nantinya
saya ingin membuat sebuah website ews, untuk memantau capaian kpi di I3L, nama web nya adalah KOMET (KPI Observation, Monitoring, and Evaluation Tool)
Web ini ingin saya bangun dengan element element berikut
1 navbar
saya ingin navbarnya berisikan logo di sebelah kiri, jika sidebar tertutup, namun jika sidebar terbuka logo ini hilang dan digantikan oleh logo yang ada di sidebar itu sendiri, di sebelah kanan logo ada breadcrumbs dengan text (Student > Overview, Student > Student Data, Graduate, dan Student > MBKM) tergantung tab sidebar mana yang dibuka oleh user, di sebelah kanannya lagi ada icon notifikasi dan sebelah kanannya icon ini ada icon inisial nama sesuai dengan nama yang berada di sebelah kanannya, yang mana nama ini bisa di klik dan menampilkan dropdown Management Akun, dan Sign Out
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
|    LOGO    Student > Overview                 (notification Icon)     (Initial name Icon) Full Name "V" ("V" adalah dropdown) |
|_______________________________________________________________________________________________________________________________|

2. sidebar pada sidebar terdapat 1 tab utama yang di dalamnya terdiri dari 3 tab, tab utama ini yaitu tab Student di sebelah kanan text nya ada icon "V", yang mana ketika nama atau icon "V" ini di klik bisa menampilkan 3 tab dibawah nya dan bisa juga menyembunyikan dengan icon "^" untuk menyembunyikan. gambarannya seperti berikut

|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
|                                   |
|              LOGO                 |
|                                   |
|___________________________________|
|                                   |
|                                   |
|     Student              ^        |
|     _________________________     |
|     |   Student Data         |    |
|     ‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾    |
|     _________________________     |
|     |   Graduate             |    |
|     ‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾    |
|     _________________________     |
|     |   Graduate             |    |
|     ‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾    |
|                                   |
|                                   |
|                                   |
|                                   |
|                                   |
|                                   |
|                                   |
|                                   |
|                                   |
|                                   |
|                                   |
|                                   |
|                                   |
|___________________________________|
3 tab yang ada pada tab utama student di sidebar ini berisikan: 
2.1 Tab Overview
        Tab ini berisikan seluruh card card yang ada pada Tab Student Data, Graduate, dan MBKM yang masing masingnya memiliki card yang bisa di klik dan menampilkan popup detail dalam bentuk chart yang bermacam macam
        Gambarannya "Student Overview" yang berada di kiri sebagai judul dan sebelah kanannya ada text "View Student Data" yang bisa di klik dan mengarahkan ke "Tab student Data"
        contohnya seperti berikut
        Student Data                            View Student Data
        |‾‾‾‾‾‾‾|       |‾‾‾‾‾‾‾|        |‾‾‾‾‾‾‾|        |‾‾‾‾‾‾‾|
        |      |       |       |        |      |        |      |
        |______|       |_______|        |______|        |______|
        Graduate                                   View Graduate
        |‾‾‾‾‾‾‾|       |‾‾‾‾‾‾‾|        |‾‾‾‾‾‾‾|        |‾‾‾‾‾‾‾|
        |      |       |       |        |      |        |      |
        |______|       |_______|        |______|        |______|
        MBKM                                           View MBKM
        |‾‾‾‾‾‾‾|       |‾‾‾‾‾‾‾|        |‾‾‾‾‾‾‾|        |‾‾‾‾‾‾‾|
        |      |       |       |        |      |        |      |
        |______|       |_______|        |______|        |______|

2.2 Tab Student Data
        Tab ini berisikan 4 card di bagian atas nya dengan masing masing card bernama Total Mahasiswa Aktif, Persentase Mahasiswa Asing, Intake Mahasiswa Baru, Penurunan mahasiswa
        |‾‾‾‾‾‾‾|        |‾‾‾‾‾‾‾|        |‾‾‾‾‾‾‾|        |‾‾‾‾‾‾‾|
        |judul  |       |judul  |        |judul |        |judul |
        |angka  |       |angka  |        |angka |        |angka |
        |perba- |       |perba- |        |perba-|        |perba-|
        |dingan |       |dingan |        |dingan|        |dingan|
        |______|        |_______|        |______|        |______|
        setiap card menampilkan angka perhitungan dan berbandingan dengan tahun lalu yang akurat, ketika salah satu card di atas diklik maka akan menampilkan popup detail dari card tersebut dan juga di visualisasikan dalam bentuk chart
         
        1. untuk card Total Mahasiswa Aktif Ketika di klik akan menampilkan popup yang terdapat 3 chart di dalam nya yang di bagi menjadi 3 tab yaitu 
            1. Distribusi per Program Studi dengan chart (Grafik batang yang arahnya dari kanan ke kiri secara umum disebut sebagai grafik horizontal terbalik (reversed horizontal bar chart) atau grafik dengan sumbu X terbalik (reversed X-axis).), 
            2. Distribusi per Fakultas (Grafik batang yang arahnya dari bawah ke atas disebut grafik batang vertikal), 
            3. Distribusi Jenjang Pendidikan Diagram Donat
        2. untuk card Persentase Mahasiswa Asing Ketika di klik akan menampilkan popup yang menampilkan chart  Tren 5 Tahun: Persentase Mahasiswa Asing
        3. Intake Mahasiswa Baru menampilkan chart Intake Angkatan 2026
        popup ini bisa di close ketika user mengklik apasaja di luar kotak popup
        kurang lebih gambaran popunnya nanti 
        |‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
        |                                                                                                |
        |                                                                                                |
        |                                                                                                |
        |       text judul                                                                               |
        |                                                                                                |
        |                                                                                                |
        |       keterangan                                                                               |
        |                                                                                                |
        |                                                                                                |
        |                                                                                                |
        |       tab1 (default)            tab2                       tab3                                |
        |                                                                                                |
        |                                                                                                |
        |                                                                                                |
        |                                                                                                |
        |                                                                                                |
        |                                                                                                |
        |                                                                                                |
        |                                                                                                |
        |                                                                                                |
        |                                                                                                |
        |                                                    chart                                       |
        |                                                                                                |
        |                                                                                                |
        |                                                                                                |
        |                                                                                                |
        |                                                                                                |
        |                                                                                                |
        |                                                                                                |
        |                                                                                                |
        |                                                                                                |
        |________________________________________________________________________________________________|
2.3 Tab Graduate
2.4 Tab MBKM















