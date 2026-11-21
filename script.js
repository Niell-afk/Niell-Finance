let data = JSON.parse(localStorage.getItem("keuangan")) || {
    pemasukan: 0,
    pengeluaran: 0,
    tabungan: 0,
    darurat: 0,
    riwayat: []
};

let targetTabungan = Number(localStorage.getItem("targetTabungan")) || 10000000;
let budgetBulanan = Number(localStorage.getItem("budgetBulanan")) || 1000000;
function formatRupiah(angka) {
    return "Rp" + angka.toLocaleString("id-ID");
}

function updateDashboard() {
    document.getElementById("totalPemasukan").innerText = formatRupiah(data.pemasukan);
    document.getElementById("totalPengeluaran").innerText = formatRupiah(data.pengeluaran);
    document.getElementById("totalTabungan").innerText = formatRupiah(data.tabungan);
    document.getElementById("totalDarurat").innerText = formatRupiah(data.darurat);

    let saldo = data.pemasukan - data.pengeluaran - data.tabungan - data.darurat;
    document.getElementById("saldoTersedia").innerText = formatRupiah(saldo);

    let bulanIni = new Date().toISOString().slice(0, 7);

    let ringkasan = {
        pemasukan: 0,
        pengeluaran: 0,
        tabungan: 0,
        darurat: 0
    };

    data.riwayat.forEach(item => {
        if (item.tanggal && item.tanggal.startsWith(bulanIni)) {
            ringkasan[item.jenis] += item.nominal;
        }
    });

    document.getElementById("bulananMasuk").innerText = formatRupiah(ringkasan.pemasukan);
    document.getElementById("bulananKeluar").innerText = formatRupiah(ringkasan.pengeluaran);
    document.getElementById("nilaiBudget").innerText = formatRupiah(budgetBulanan);

let status = document.getElementById("statusBudget");

if (ringkasan.pengeluaran >= budgetBulanan) {
    status.innerText = "Budget tercapai atau terlampaui!";
} else {
    status.innerText = "Sisa budget: " +
        formatRupiah(budgetBulanan - ringkasan.pengeluaran);
}
    document.getElementById("bulananTabungan").innerText = formatRupiah(ringkasan.tabungan);
    document.getElementById("bulananDarurat").innerText = formatRupiah(ringkasan.darurat);
    let sisa = ringkasan.pemasukan - ringkasan.pengeluaran
    - ringkasan.tabungan - ringkasan.darurat;

document.getElementById("bulananSisa").innerText = formatRupiah(sisa);
   let target = targetTabungan;
document.getElementById("nilaiTarget").innerText = formatRupiah(target);
let persen = Math.min((data.tabungan / target) * 100, 100);

document.getElementById("progressTabungan").value = data.tabungan;
document.getElementById("persenTabungan").innerText =
    persen.toFixed(1) + "% tercapai";
    updateGrafikKategori();
}
function simpanData() {
    localStorage.setItem("keuangan", JSON.stringify(data));
}
function isiFilterBulan() {
    let filter = document.getElementById("filterBulan");
    let bulanTersimpan = filter.value;

    let daftarBulan = [...new Set(
        data.riwayat
            .filter(item => item.tanggal)
            .map(item => item.tanggal.slice(0, 7))
    )].sort().reverse();

    filter.innerHTML = '<option value="semua">Semua Bulan</option>';

    daftarBulan.forEach(bulan => {
        let option = document.createElement("option");
        option.value = bulan;
   let [tahun, nomorBulan] = bulan.split("-");
let namaBulan = new Date(tahun, nomorBulan - 1)
    .toLocaleDateString("id-ID", { month: "long" });

option.textContent = namaBulan + " " + tahun;
        filter.appendChild(option);
    });

    filter.value = daftarBulan.includes(bulanTersimpan)
        ? bulanTersimpan
        : "semua";
        let filterGrafik = document.getElementById("filterGrafik");
let bulanGrafik = filterGrafik.value;

filterGrafik.innerHTML = '<option value="semua">Semua Bulan</option>';

daftarBulan.forEach(bulan => {
    let option = document.createElement("option");
    option.value = bulan;

    let [tahun, nomorBulan] = bulan.split("-");
    let namaBulan = new Date(tahun, nomorBulan - 1)
        .toLocaleDateString("id-ID", { month: "long" });

    option.textContent = namaBulan + " " + tahun;
    filterGrafik.appendChild(option);
});

filterGrafik.value = daftarBulan.includes(bulanGrafik)
    ? bulanGrafik
    : "semua";
    let filterKategori = document.getElementById("filterKategori");
let kategoriTersimpan = filterKategori.value;

let daftarKategori = [
    ["gaji", "Gaji"],
    ["bonus", "Bonus"],
    ["bisnis", "Bisnis"],
    ["penjualan", "Penjualan"],
    ["hadiah", "Hadiah"],
    ["makanan", "Makanan"],
    ["transportasi", "Transportasi"],
    ["internet", "Internet"],
    ["hiburan", "Hiburan"],
    ["belanja", "Belanja"],
    ["tagihan", "Tagihan"],
    ["tabungan", "Tabungan"],
    ["keluarga", "Keluarga"],
    ["darurat", "Darurat"],
    ["lainnya", "Lainnya"]
];

filterKategori.innerHTML =
    '<option value="semua">Semua Kategori</option>';

daftarKategori.forEach(([value, label]) => {
    let option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    filterKategori.appendChild(option);
});

filterKategori.value = kategoriTersimpan || "semua";
}
function tampilkanRiwayat() {
    let riwayat = document.getElementById("riwayatTransaksi");
    isiFilterBulan();
    let filter = document.getElementById("filterBulan").value;
    let tanggalMulai = document.getElementById("tanggalMulai").value;
let tanggalAkhir = document.getElementById("tanggalAkhir").value;
    let pencarian = document.getElementById("cariTransaksi").value.toLowerCase();
    let filterJenis = document.getElementById("filterJenis").value;
    let filterKategori = document.getElementById("filterKategori").value;

    riwayat.innerHTML = "";

    data.riwayat.forEach((item, index) => {
        if (filterJenis !== "semua" && item.jenis !== filterJenis) {
    return;
}
if (tanggalMulai && item.tanggal < tanggalMulai) return;
if (tanggalAkhir && item.tanggal > tanggalAkhir) return;
if (filterKategori !== "semua" && item.kategori !== filterKategori) {
    return;
}
        if (!item.nama.toLowerCase().includes(pencarian)) {
    return;
}
        if (filter !== "semua" && (!item.tanggal || !item.tanggal.startsWith(filter))) {
            return;
        }

        let li = document.createElement("li");
        console.log(item.jenis, li);

li.style.borderLeft = "5px solid " + ({
    pemasukan: "green",
    pengeluaran: "red",
    tabungan: "blue",
    darurat: "orange"
}[item.jenis] || "gray");

li.innerHTML = `
    <span>${item.tanggal || "Tanpa tanggal"} | ${item.nama}</span>
    <strong class="${item.jenis}">
        ${formatRupiah(item.nominal)}
    </strong>
    <small>(${item.jenis} - ${item.kategori || "lainnya"})</small>
`;

        let tombol = document.createElement("button");
        let tombolEdit = document.createElement("button");
tombolEdit.innerText = "Edit";

tombolEdit.onclick = function() {
let namaBaru = prompt("Nama transaksi:", item.nama);
let tanggalBaru = prompt(
    "Tanggal transaksi (YYYY-MM-DD):",
    item.tanggal
);

if (tanggalBaru === null || !/^\d{4}-\d{2}-\d{2}$/.test(tanggalBaru)) {
    alert("Format tanggal salah!");
    return;
}
if (namaBaru === null || namaBaru.trim() === "") return;

let nominalBaru = Number(prompt("Nominal baru:", item.nominal));
if (!nominalBaru || nominalBaru <= 0) return;
let jenisBaru = prompt(
    "Jenis transaksi: pemasukan, pengeluaran, tabungan, darurat",
    item.jenis
);

if (!["pemasukan", "pengeluaran", "tabungan", "darurat"].includes(jenisBaru)) {
    alert("Jenis transaksi tidak valid!");
    return;
}

let daftarKategori = {
    pemasukan: ["gaji", "bonus", "bisnis", "penjualan", "hadiah", "lainnya"],
    pengeluaran: ["makanan", "transportasi", "internet", "hiburan", "belanja", "tagihan", "bisnis", "lainnya"],
    tabungan: ["tabungan", "keluarga"],
    darurat: ["darurat"]
};

let kategoriBaru = prompt(
    "Pilih kategori:\n" + daftarKategori[jenisBaru].join(", "),
    item.kategori || "lainnya"
);

if (!daftarKategori[jenisBaru].includes(kategoriBaru)) {
    alert("Kategori tidak valid!");
    return;
}
data[item.jenis] -= item.nominal;
data[jenisBaru] += nominalBaru;

item.jenis = jenisBaru;
item.kategori = kategoriBaru;

item.nama = namaBaru.trim();
item.nominal = nominalBaru;
item.tanggal = tanggalBaru;

simpanData();
updateDashboard();
updateGrafik();
tampilkanRiwayat();
};

li.appendChild(tombolEdit);
        tombol.innerText = "Hapus";

        tombol.onclick = function() {
            data[item.jenis] -= item.nominal;
            data.riwayat.splice(index, 1);

            simpanData();
updateDashboard();
updateGrafik();
tampilkanRiwayat();
        };

        li.appendChild(tombol);
        riwayat.appendChild(li);
    }); 
}
function tambahTransaksi() {
    let nama = document.getElementById("namaTransaksi").value;
    let nominal = Number(document.getElementById("nominalTransaksi").value);
    let jenis = document.getElementById("jenisTransaksi").value;

    if (nama.trim() === "" || nominal <= 0) {
        alert("Isi data dengan benar!");
        return;
    }

    data[jenis] += nominal;

data.riwayat.push({
    nama: nama,
    nominal: nominal,
    jenis: jenis,
    kategori: document.getElementById("kategoriTransaksi").value,
    tanggal: new Date().toISOString().slice(0, 10)
});

    simpanData();
updateDashboard();
updateGrafik();
tampilkanRiwayat();

    document.getElementById("namaTransaksi").value = "";
    document.getElementById("nominalTransaksi").value = "";
}

updateDashboard();
let bulanIni = new Date().toISOString().slice(0, 7);

let ringkasan = {
    pemasukan: 0,
    pengeluaran: 0,
    tabungan: 0,
    darurat: 0
};

data.riwayat.forEach(item => {
    if (item.tanggal && item.tanggal.startsWith(bulanIni)) {
        ringkasan[item.jenis] += item.nominal;
    }
});

document.getElementById("bulananMasuk").innerText = formatRupiah(ringkasan.pemasukan);
document.getElementById("bulananKeluar").innerText = formatRupiah(ringkasan.pengeluaran);
document.getElementById("bulananTabungan").innerText = formatRupiah(ringkasan.tabungan);
document.getElementById("bulananDarurat").innerText = formatRupiah(ringkasan.darurat);
tampilkanRiwayat();
function backupData() {
    let isi = JSON.stringify(data, null, 4);

    let file = new Blob([isi], {
        type: "application/json"
    });

    let link = document.createElement("a");
    link.href = URL.createObjectURL(file);
    link.download = "backup-keuangan.json";
    link.click();

    URL.revokeObjectURL(link.href);
}

function restoreData() {
    let file = document.getElementById("fileBackup").files[0];

    if (!file) {
        alert("Pilih file backup dulu!");
        return;
    }

    let reader = new FileReader();

    reader.onload = function(e) {
        try {
            let hasil = JSON.parse(e.target.result);

            if (
                typeof hasil.pemasukan !== "number" ||
                !Array.isArray(hasil.riwayat)
            ) {
                alert("File backup tidak valid!");
                return;
            }

            data = hasil;
            simpanData();
            updateDashboard();
            isiFilterBulan();
            tampilkanRiwayat();
            updateGrafik();
            console.log("Fungsi grafik dijalankan")

            alert("Data berhasil dipulihkan!");
        } catch {
            alert("File backup rusak atau tidak valid!");
        }
    };

    reader.readAsText(file);
}
let grafikKeuangan;
updateDashboard();
isiFilterBulan();
tampilkanRiwayat();
updateGrafik();

function updateGrafik() {
let filter = document.getElementById("filterGrafik").value;
let bulanIni = filter;
    let pemasukan = 0;
    let pengeluaran = 0;

    data.riwayat.forEach(item => {
   if (
    item.tanggal &&
    (filter === "semua" || item.tanggal.startsWith(bulanIni))
) {
            if (item.jenis === "pemasukan") {
                pemasukan += Number(item.nominal);
            }

            if (item.jenis === "pengeluaran") {
                pengeluaran += Number(item.nominal);
            }
        }
    });

    let ctx = document.getElementById("grafikKeuangan");

    if (!ctx) return;

    let grafikLama = Chart.getChart(ctx);

    if (grafikLama) {
        grafikLama.destroy();
    }

    grafikKeuangan = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["Pemasukan", "Pengeluaran"],
            datasets: [{
                label: "Bulan Ini",
                data: [pemasukan, pengeluaran],
                backgroundColor: ["#16a34a", "#dc2626"]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function ubahTarget() {
    let targetBaru = Number(document.getElementById("inputTarget").value);

    if (targetBaru <= 0) {
        alert("Target harus lebih dari 0!");
        return;
    }

    targetTabungan = targetBaru;
    localStorage.setItem("targetTabungan", targetTabungan);
    document.getElementById("inputTarget").value = "";
    updateDashboard();
}
function ubahBudget() {
    let budgetBaru = Number(document.getElementById("inputBudget").value);

    if (budgetBaru <= 0) {
        alert("Budget harus lebih dari 0!");
        return;
    }

    budgetBulanan = budgetBaru;

    localStorage.setItem("budgetBulanan", budgetBulanan);

    document.getElementById("inputBudget").value = "";

    updateDashboard();
}
function updateGrafikKategori() {
    let kategoriData = {};

    data.riwayat.forEach(item => {
        if (item.jenis === "pengeluaran") {
            let kategori = item.kategori || "lainnya";

            kategoriData[kategori] =
                (kategoriData[kategori] || 0) + Number(item.nominal);
        }
    });

    let canvas = document.getElementById("grafikKategori");

    let grafikLama = Chart.getChart(canvas);
    if (grafikLama) grafikLama.destroy();

    new Chart(canvas, {
        type: "pie",
        data: {
            labels: Object.keys(kategoriData),
            datasets: [{
                data: Object.values(kategoriData)
            }]
        },
        options: {
            responsive: true
        }
    });
}
function exportExcel() {
    let filter = document.getElementById("filterBulan").value;

    let transaksi = data.riwayat.filter(item => {
        return filter === "semua" ||
            (item.tanggal && item.tanggal.startsWith(filter));
    });

    let laporan = transaksi.map(item => ({
        Tanggal: item.tanggal,
        Nama: item.nama,
        Jenis: item.jenis,
        Kategori: item.kategori || "lainnya",
        Nominal: item.nominal
    }));

    let worksheet = XLSX.utils.json_to_sheet(laporan);
    let workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Laporan Keuangan"
    );

    XLSX.writeFile(workbook, "Laporan_Keuangan.xlsx");
}
function ubahKategori() {
    let jenis = document.getElementById("jenisTransaksi").value;
    let kategori = document.getElementById("kategoriTransaksi");

    let pilihan = {
        pemasukan: {
            gaji: "Gaji",
            bonus: "Bonus",
            bisnis: "Profit Bisnis",
            penjualan: "Penjualan",
            hadiah: "Hadiah",
            lainnya: "Lainnya"
        },
        pengeluaran: {
            makanan: "Makanan",
            transportasi: "Transportasi",
            internet: "Pulsa / Internet",
            hiburan: "Hiburan",
            belanja: "Belanja",
            tagihan: "Tagihan",
            bisnis: "Modal / Bisnis",
            lainnya: "Lainnya"
        },
       tabungan: {
    tabungan: "Tabungan Pribadi",
    keluarga: "Tabungan Keluarga"
},
        darurat: {
            darurat: "Dana Darurat"
        }
    };

    kategori.innerHTML = "";

    Object.entries(pilihan[jenis]).forEach(([value, label]) => {
        kategori.innerHTML += `<option value="${value}">${label}</option>`;
    });
}
ubahKategori();
