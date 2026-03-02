const API = "https://unentered-unsteadily-nona.ngrok-free.dev/api";

document.addEventListener("DOMContentLoaded", () => {
    const usuario = JSON.parse(localStorage.getItem("usuario"));

    if(!usuario){
        alert("Debes iniciar sesión primero");
        location.href = "login.html";
        return;
    }

    document.getElementById("nombreDocente").textContent = `${usuario.nombre} ${usuario.apellido}`;
});


let alumnosCargados = [];
let docenteID = null;
let chart;

async function cargarClases() {
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    docenteID = usuario.id_usuario;

    const res = await fetch(`${API}/clases/docente/${docenteID}`);
    const data = await res.json();
    
    const select = document.getElementById("selectClase");
    select.innerHTML = `<option value="">Seleccionar...</option>`;

    data.forEach(c => {
        let op = document.createElement("option");
        op.value = c.id_clase;
        op.textContent = c.nombre_clase;
        select.appendChild(op);
    });
}

document.getElementById("selectClase").addEventListener("change", cargarGrupos);

async function cargarGrupos(){
    const idClase = document.getElementById("selectClase").value;
    if(!idClase) return;

    const resClases = await fetch(`${API}/clases`);
    const clases = await resClases.json();

    const claseSel = clases.find(c => c.id_clase == idClase);
    const idGrupo = claseSel.id_grupo;

    const resGrupo = await fetch(`${API}/grupos`);
    const grupos = await resGrupo.json();

    const selectGrupo = document.getElementById("selectGrupo");
    selectGrupo.innerHTML = "";

    grupos.filter(g => g.id_grupo == idGrupo).forEach(g=>{
        let option = document.createElement("option");
        option.value = g.id_grupo;
        option.textContent = `${g.nombre_grupo} (${g.grado}° - ${g.turno})`;
        selectGrupo.appendChild(option);
    });

    alumnosCargados = [];
    document.querySelector("#tablaAlumnos tbody").innerHTML="";

    const clase = document.getElementById("selectClase").value;
    const fecha = document.getElementById("selectFecha").value;

    if(fecha) cargarAlumnosYVerificar();
}

document.getElementById("selectGrupo").addEventListener("change", cargarAlumnosYVerificar);
document.getElementById("selectFecha").addEventListener("change", cargarAlumnosYVerificar);

async function cargarAlumnosYVerificar(){
    const grupo = document.getElementById("selectGrupo").value;
    const clase = document.getElementById("selectClase").value;
    const fecha = document.getElementById("selectFecha").value;

    if(!grupo || !clase || !fecha) return;

    const res = await fetch(`${API}/asistencias`);
    const data = await res.json();

    const existe = data.some(a => a.id_clase == clase && a.fecha == fecha);

    if(existe){
        alert("⚠ Ya existe asistencia registrada para esta clase en esta fecha.\nUsa 'Editar asistencia' para modificarla.");

        bloquearTabla(true);
        document.getElementById("guardarAsistencia").style.display="none";
        document.getElementById("editarAsistencia").style.display="block";

        cargarAlumnos(data.filter(a => a.id_clase == clase && a.fecha == fecha));
        generarGrafica(clase);
        return;
    }

    const resAlu = await fetch(`${API}/alumnos`);
    const alumnos = await resAlu.json();
    alumnosCargados = alumnos.filter(a => a.grupo_id == grupo);

    mostrarTablaVacia();
    bloquearTabla(false);
    document.getElementById("guardarAsistencia").style.display="block";
    document.getElementById("editarAsistencia").style.display="none";
}

function mostrarTablaVacia(){
    const tbody = document.querySelector("#tablaAlumnos tbody");
    tbody.innerHTML = "";

    alumnosCargados.forEach(a=>{
        tbody.innerHTML+=`
        <tr>
            <td>${a.nombre} ${a.apellido}</td>
            <td><input type="radio" name="est_${a.id_alumno}" value="asistió"></td>
            <td><input type="radio" name="est_${a.id_alumno}" value="retardo"></td>
            <td><input type="radio" name="est_${a.id_alumno}" value="falta"></td>
            <td><input type="radio" name="est_${a.id_alumno}" value="justificado"></td>
        </tr>`;
    });
}

function cargarAlumnos(asistenciasPrevias){
    const tbody = document.querySelector("#tablaAlumnos tbody");
    tbody.innerHTML = "";

    asistenciasPrevias.forEach(reg=>{
        tbody.innerHTML+=`
        <tr>
            <td>${reg.nombre_alumno || "Alumno ID "+reg.id_alumno}</td>
            <td><input type="radio" name="est_${reg.id_alumno}" value="asistió" ${reg.estado=="asistió"?"checked":""}></td>
            <td><input type="radio" name="est_${reg.id_alumno}" value="retardo" ${reg.estado=="retardo"?"checked":""}></td>
            <td><input type="radio" name="est_${reg.id_alumno}" value="falta" ${reg.estado=="falta"?"checked":""}></td>
            <td><input type="radio" name="est_${reg.id_alumno}" value="justificado" ${reg.estado=="justificado"?"checked":""}></td>
        </tr>`;
    });
}

async function guardarAsistencia() {
    const clase = document.getElementById("selectClase").value;
    const fecha = document.getElementById("selectFecha").value;

    if (!clase) return Swal.fire("Error", "Selecciona una materia", "warning");
    if (!fecha) return Swal.fire("Error", "Selecciona una fecha", "warning");

    const res = await fetch(`${API}/asistencias`);
    const registros = await res.json();

    const ya_existe = registros.filter(r => r.id_clase == clase && r.fecha == fecha);
    const hora = new Date().toLocaleTimeString("en-GB");


    if (ya_existe.length > 0) {
        Swal.fire({
            title: "Editar asistencia",
            text: "¿Deseas actualizar los registros existentes?",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Sí, actualizar",
            cancelButtonText: "Cancelar"
        }).then(async (r) => {
            if (!r.isConfirmed) return;

            for (let reg of ya_existe) {
                let estado = document.querySelector(`input[name="est_${reg.id_alumno}"]:checked`);
                if (!estado) continue;

                await fetch(`${API}/asistencias/${reg.id_asistencia}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ estado: estado.value })
                });
            }

            Swal.fire("Actualizado", "Asistencia modificada correctamente", "success");
            bloquearTabla(true);
            document.getElementById("guardarAsistencia").style.display = "none";
            document.getElementById("editarAsistencia").style.display = "block";
            generarGrafica(clase);
        });

        return;
    }

    for (let a of alumnosCargados) {
        let est = document.querySelector(`input[name="est_${a.id_alumno}"]:checked`);
        if (!est) continue;

        await fetch(`${API}/asistencias`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id_alumno: a.id_alumno,
                id_clase: clase,
                fecha, hora,
                estado: est.value,
                registrado_por: docenteID
            })
        });
    }

    Swal.fire("Guardado", "Asistencia registrada correctamente", "success");
    bloquearTabla(true);
    document.getElementById("guardarAsistencia").style.display = "none";
    document.getElementById("editarAsistencia").style.display = "block";
    generarGrafica(clase);
}


document.getElementById("guardarAsistencia").addEventListener("click", guardarAsistencia);

document.getElementById("editarAsistencia").addEventListener("click", ()=>{
    bloquearTabla(false);
    document.getElementById("guardarAsistencia").style.display="block";
    document.getElementById("editarAsistencia").style.display="none";
});


function bloquearTabla(b){
    document.querySelectorAll("#tablaAlumnos input").forEach(inp=>inp.disabled=b);
}

async function generarGrafica(idClase){
    const res = await fetch(`${API}/asistencias`);
    const registros = await res.json();
    const data = registros.filter(r=>r.id_clase==idClase);

    const total={asistió:0,retardo:0,falta:0,justificado:0};
    data.forEach(r=>total[r.estado]++);

    if(chart) chart.destroy();

    const ctx=document.getElementById("graficaAsistencia");
    chart=new Chart(ctx,{
        type:"bar",
        data:{
            labels:["Asistió","Retardo","Falta","Justificado"],
            datasets:[{
                label:"Asistencia registrada",
                data:[total.asistió,total.retardo,total.falta,total.justificado],
                backgroundColor:["#4CAF50","#FFC107","#F44336","#03A9F4"]
            }]
        }
    });
}

cargarClases();
