const API = "https://unentered-unsteadily-nona.ngrok-free.dev/api";
let chartReporte = null;
let chartAlumno = null;
let alumnosLista = [];

document.addEventListener("DOMContentLoaded", cargarAlumnos);
document.getElementById("btnGenerar").addEventListener("click", generarReporte);
document.getElementById("btnPDF").addEventListener("click", generarPDFGeneral);
document.getElementById("btnPDFAlumno").addEventListener("click", generarPDFAlumno);

async function cargarAlumnos(){
    const res = await fetch(`${API}/alumnos`);
    alumnosLista = await res.json();

    const select = document.getElementById("selectAlumno");
    alumnosLista.forEach(a=>{
        let opt = document.createElement("option");
        opt.value = a.id_alumno;
        opt.textContent = `${a.nombre} ${a.apellido}`;
        select.appendChild(opt);
    });
}

async function generarReporte() {

    const fi = document.getElementById("fechaInicio").value;
    const ff = document.getElementById("fechaFin").value;
    const alumnoSel = document.getElementById("selectAlumno").value;

    if (!fi || !ff) return Swal.fire("Error","Selecciona ambas fechas","warning");
    if (fi > ff) return Swal.fire("Error","Rango incorrecto","error");

    const res = await fetch(`${API}/asistencias`);
    const data = await res.json();

    const filtrado = data.filter(r => r.fecha >= fi && r.fecha <= ff);

    const total = { asistió:0, retardo:0, falta:0, justificado:0 };
    filtrado.forEach(r => total[r.estado]++);

    if(chartReporte) chartReporte.destroy();
    chartReporte = new Chart(document.getElementById("graficaReporte"),{
        type:"pie",
        data:{
            labels:["Asistió","Retardo","Falta","Justificado"],
            datasets:[{
                data:[total.asistió,total.retardo,total.falta,total.justificado],
                backgroundColor:["#4CAF50","#FFC107","#F44336","#03A9F4"]
            }]
        }
    });

    document.getElementById("btnPDF").style.display = "block";
    window.resumenPDFGeneral = total;
    window.rangoPDF = {inicio:fi, fin:ff};

    // REPORTE POR ALUMNO
    if(alumnoSel !== ""){
        const alumnoDatos = alumnosLista.find(a=>a.id_alumno == alumnoSel);

        const filtroAlumno = filtrado.filter(r=>r.id_alumno == alumnoSel);

        const totalAlumno = { asistió:0, retardo:0, falta:0, justificado:0 };
        filtroAlumno.forEach(r => totalAlumno[r.estado]++);

        if(chartAlumno) chartAlumno.destroy();

        chartAlumno = new Chart(document.getElementById("graficaAlumno"),{
            type:"bar",
            data:{
                labels:["Asistió","Retardo","Falta","Justificado"],
                datasets:[{
                    data:[totalAlumno.asistió,totalAlumno.retardo,totalAlumno.falta,totalAlumno.justificado],
                    backgroundColor:["#4CAF50","#FFC107","#F44336","#03A9F4"]
                }]
            }
        });

        document.getElementById("cardAlumno").style.display = "block";

        setTimeout(()=>{
            document.getElementById("btnPDFAlumno").style.display="block";
        },300);


        document.getElementById("btnPDFAlumno").style.display="block";
        window.reporteAlumno = {
            alumno:`${alumnoDatos.nombre} ${alumnoDatos.apellido}`,
            ...totalAlumno
        };

    } else {
        document.getElementById("btnPDFAlumno").style.display="none";
    }

    Swal.fire("Reporte listo","Puedes generar PDF","success");
}

// PDF GENERAL
async function generarPDFGeneral(){
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();

    pdf.setFontSize(18);
    pdf.text("Reporte General de Asistencias", 50, 15);

    pdf.setFontSize(12);
    pdf.text(`Desde: ${rangoPDF.inicio}  -  Hasta: ${rangoPDF.fin}`, 15, 30);

    pdf.text(`Asistió:      ${resumenPDFGeneral.asistió}`,15,45);
    pdf.text(`Retardo:      ${resumenPDFGeneral.retardo}`,15,52);
    pdf.text(`Faltó:        ${resumenPDFGeneral.falta}`,15,59);
    pdf.text(`Justificado:  ${resumenPDFGeneral.justificado}`,15,66);

    const canvas = await html2canvas(document.getElementById("graficaReporte"));
    const img = canvas.toDataURL("image/png");
    pdf.addImage(img,"PNG",120,35,70,70);

    pdf.save("Reporte_General_Asistencias.pdf");
    Swal.fire("PDF generado","Archivo descargado","success");
}

// PDF POR ALUMNO
async function generarPDFAlumno(){
    if(!window.reporteAlumno){
        return Swal.fire("Error","Genera primero el reporte del alumno","error");
    }

    const canvasElement = document.getElementById("graficaAlumno");

    if(!canvasElement || canvasElement.offsetHeight === 0){
        document.getElementById("cardAlumno").style.display = "block";
        await new Promise(res=>setTimeout(res,400)); 
    }

    let imgData;

    try{
        imgData = chartAlumno.toBase64Image();

        if(!imgData || imgData.length < 100){
            const canvas = await html2canvas(canvasElement,{backgroundColor:"#fff"});
            imgData = canvas.toDataURL("image/png");
        }
        
    }catch(e){
        console.error(e);
        return Swal.fire("Error","No se pudo generar la imagen del gráfico","error");
    }

    // CREACIÓN DEL PDF
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();

    pdf.setFontSize(18);
    pdf.text("Reporte Individual de Asistencia", 50, 15);

    pdf.setFontSize(12);
    pdf.text(`Alumno: ${reporteAlumno.alumno}`,15,30);
    pdf.text(`Periodo: ${rangoPDF.inicio} → ${rangoPDF.fin}`,15,37);

    pdf.text(`Asistió:      ${reporteAlumno.asistió}`,15,50);
    pdf.text(`Retardo:      ${reporteAlumno.retardo}`,15,57);
    pdf.text(`Faltó:        ${reporteAlumno.falta}`,15,64);
    pdf.text(`Justificado:  ${reporteAlumno.justificado}`,15,71);

    pdf.addImage(imgData,"PNG",120,40,70,80);

    pdf.save(`Reporte_${reporteAlumno.alumno.replace(/\s/g,'_')}.pdf`);

    Swal.fire("PDF Generado","Descargado exitosamente","success");
}



