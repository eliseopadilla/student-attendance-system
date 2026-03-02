const API_URL = "https://unentered-unsteadily-nona.ngrok-free.dev";
document.getElementById("apiLabel").innerText = API_URL;

let dtAlumnos, dtGrupos, dtClases, dtDocentes;

$(document).ready(function () {
  initTables();
  loadGruposSelects();
  loadDocentesSelects();
  bindUI();
});

function initTables() {

  dtAlumnos = $('#tablaAlumnos').DataTable({
    ajax: { url: `${API_URL}/api/alumnos`, dataSrc: '' },
    columns: [
      { data: 'id_alumno' },
      { data: 'matricula' },
      { data: 'nombre' },
      { data: 'apellido' },
      { data: 'grupo' },
      { data: 'status', render: s => s === 'activo'
          ? '<span class="badge bg-success">Activo</span>'
          : '<span class="badge bg-secondary">Inactivo</span>' },
      { data: 'fecha_registro', render: f => f ? new Date(f).toLocaleString() : '' },
      { data: null, className:'dt-center', render: r => `
          <button class="btn btn-warning btn-sm" onclick="editarAlumno(${r.id_alumno})"><i class="fa fa-edit"></i></button>
          <button class="btn btn-danger btn-sm" onclick="eliminarAlumno(${r.id_alumno})"><i class="fa fa-trash"></i></button>
        `}
    ]
  });

  dtGrupos = $('#tablaGrupos').DataTable({
    ajax: { url: `${API_URL}/api/grupos`, dataSrc: '' },
    columns: [
      { data: 'id_grupo' },
      { data: 'nombre_grupo' },
      { data: 'grado' },
      { data: 'turno' },
      { data: null, className:'dt-center', render: r => `
          <button class="btn btn-warning btn-sm" onclick="editarGrupo(${r.id_grupo})"><i class="fa fa-edit"></i></button>
          <button class="btn btn-danger btn-sm" onclick="eliminarGrupo(${r.id_grupo})"><i class="fa fa-trash"></i></button>
        `}
    ]
  });

  dtClases = $('#tablaClases').DataTable({
    ajax: { url: `${API_URL}/api/clases`, dataSrc: '' },
    columns: [
      { data: 'id_clase' },
      { data: 'nombre_clase' },
      { data: 'docente' },
      { data: 'grupo' },
      { data: null, className:'dt-center', render: r => `
          <button class="btn btn-warning btn-sm" onclick="editarClase(${r.id_clase})"><i class="fa fa-edit"></i></button>
          <button class="btn btn-danger btn-sm" onclick="eliminarClase(${r.id_clase})"><i class="fa fa-trash"></i></button>
        `}
    ]
  });

  dtDocentes = $('#tablaDocentes').DataTable({
    ajax: { url: `${API_URL}/api/usuarios`, dataSrc: '' },
    columns: [
      { data: 'id_usuario' },
      { data: 'nombre' },
      { data: 'apellido' },
      { data: 'email' },
      { data: 'rol' },
      { data: null, className:'dt-center', render: r => `
          <button class="btn btn-warning btn-sm" onclick="editarDocente(${r.id_usuario})"><i class="fa fa-edit"></i></button>
          <button class="btn btn-danger btn-sm" onclick="eliminarDocente(${r.id_usuario})"><i class="fa fa-trash"></i></button>
        `}
    ]
  });

}

function loadGruposSelects() {
  $.get(`${API_URL}/api/grupos`, function (data) {
    let html = `<option value="">Seleccione Grupo</option>`;
    data.forEach(g => html += `<option value="${g.id_grupo}">${g.nombre_grupo}</option>`);
    $('#alumno_grupo').html(html);
    $('#clase_grupo').html(html);
  });
}

function loadDocentesSelects() {
  $.get(`${API_URL}/api/usuarios`, function (data) {
    let html = `<option value="">Seleccione docente</option>`;
    data.filter(u => u.rol === "docente").forEach(d => html += `<option value="${d.id_usuario}">${d.nombre} ${d.apellido}</option>`);
    $('#clase_docente').html(html);
  });
}

function bindUI() {

  $('#searchAlumnos').on('keyup', function () {
    dtAlumnos.search(this.value).draw();
  });

  $('#btnRefreshAll').on('click', recargarTodo);
  $('#btnRefDocentes').on('click', () => dtDocentes.ajax.reload());

  // ALUMNOS 
  $('#formAlumno').on('submit', function (e) {
    e.preventDefault();
    const id = $('#alumnoId').val();

    const payload = {
      nombre: $('#alumno_nombre').val(),
      apellido: $('#alumno_apellido').val(),
      matricula: $('#alumno_matricula').val(),
      grupo_id: $('#alumno_grupo').val(),
      status: $('#alumno_status').val()
    };

    if (!id) {
      $.ajax({
        url: `${API_URL}/api/alumnos`,
        method: "POST",
        data: JSON.stringify(payload),
        contentType: "application/json",
        success: () => {
          $('#modalAlumno').modal('hide');
          dtAlumnos.ajax.reload();
          Swal.fire('Éxito','Alumno creado','success');
        }
      });
    } else {
      $.ajax({
        url: `${API_URL}/api/alumnos/${id}`,
        method: "PUT",
        data: JSON.stringify(payload),
        contentType: "application/json",
        success: () => {
          $('#modalAlumno').modal('hide');
          dtAlumnos.ajax.reload();
          Swal.fire('Actualizado','Alumno actualizado','success');
        }
      });
    }
  });

  // GRUPOS 
  $('#formGrupo').on('submit', function (e) {
    e.preventDefault();
    const id = $('#grupoId').val();

    const payload = {
      nombre_grupo: $('#grupo_nombre').val(),
      grado: $('#grupo_grado').val(),
      turno: $('#grupo_turno').val()
    };

    if (!id) {
      $.ajax({
        url: `${API_URL}/api/grupos`,
        method: "POST",
        data: JSON.stringify(payload),
        contentType: "application/json",
        success: () => {
          $('#modalGrupo').modal('hide');
          dtGrupos.ajax.reload();
          loadGruposSelects();
          Swal.fire('Éxito','Grupo creado','success');
        }
      });
    } else {
      $.ajax({
        url: `${API_URL}/api/grupos/${id}`,
        method: "PUT",
        data: JSON.stringify(payload),
        contentType: "application/json",
        success: () => {
          $('#modalGrupo').modal('hide');
          dtGrupos.ajax.reload();
          loadGruposSelects();
          Swal.fire('Actualizado','Grupo actualizado','success');
        }
      });
    }
  });

  // CLASE 
  $('#formClase').on('submit', function (e) {
    e.preventDefault();
    const id = $('#claseId').val();

    const payload = {
      nombre_clase: $('#clase_nombre').val(),
      id_docente: $('#clase_docente').val(),
      id_grupo: $('#clase_grupo').val()
    };

    if (!id) {
      $.ajax({
        url: `${API_URL}/api/clases`,
        method: "POST",
        data: JSON.stringify(payload),
        contentType: "application/json",
        success: () => {
          $('#modalClase').modal('hide');
          dtClases.ajax.reload();
          Swal.fire('Éxito','Clase creada','success');
        }
      });
    } else {
      $.ajax({
        url: `${API_URL}/api/clases/${id}`,
        method: "PUT",
        data: JSON.stringify(payload),
        contentType: "application/json",
        success: () => {
          $('#modalClase').modal('hide');
          dtClases.ajax.reload();
          Swal.fire('Actualizada','Clase actualizada','success');
        }
      });
    }
  });

  // DOCENTES
  $('#formDocente').on('submit', function(e) {
    e.preventDefault();
    const id = $('#docenteId').val();

    const payload = {
      nombre: $('#docente_nombre').val(),
      apellido: $('#docente_apellido').val(),
      email: $('#docente_email').val(),
      rol: $('#docente_rol').val()
    };

    if (!id) {
      $.ajax({
        url: `${API_URL}/api/usuarios`,
        method: "POST",
        data: JSON.stringify(payload),
        contentType: "application/json",
        success: () => {
          $('#modalDocente').modal('hide');
          dtDocentes.ajax.reload();
          loadDocentesSelects();
          Swal.fire("Éxito", "Docente creado", "success");
        }
      });
    } else {
      $.ajax({
        url: `${API_URL}/api/usuarios/${id}`,
        method: "PUT",
        data: JSON.stringify(payload),
        contentType: "application/json",
        success: () => {
          $('#modalDocente').modal('hide');
          dtDocentes.ajax.reload();
          loadDocentesSelects();
          Swal.fire("Actualizado", "Docente actualizado", "success");
        }
      });
    }
  });

}

function editarAlumno(id) {
  $.get(`${API_URL}/api/alumnos/${id}`, function(a) {
    $('#alumnoId').val(a.id_alumno);
    $('#alumno_nombre').val(a.nombre);
    $('#alumno_apellido').val(a.apellido);
    $('#alumno_matricula').val(a.matricula);
    $('#alumno_grupo').val(a.grupo_id);
    $('#alumno_status').val(a.status);
    $('#tituloAlumno').text("Editar Alumno");
    $('#modalAlumno').modal('show');
  });
}

function eliminarAlumno(id) {
  Swal.fire({
    title: "¿Eliminar alumno?",
    showCancelButton: true
  }).then(r=>{
    if (!r.isConfirmed) return;
    $.ajax({
      url: `${API_URL}/api/alumnos/${id}`,
      method: "DELETE",
      success: ()=>{
        dtAlumnos.ajax.reload();
        Swal.fire("Eliminado","Alumno eliminado","success");
      }
    });
  });
}

function editarGrupo(id) {
  $.get(`${API_URL}/api/grupos`, function(all){
    const g = all.find(x=> x.id_grupo==id);
    $('#grupoId').val(g.id_grupo);
    $('#grupo_nombre').val(g.nombre_grupo);
    $('#grupo_grado').val(g.grado);
    $('#grupo_turno').val(g.turno);
    $('#tituloGrupo').text("Editar Grupo");
    $('#modalGrupo').modal('show');
  });
}

function eliminarGrupo(id) {
  Swal.fire({
    title:"¿Eliminar grupo?",
    showCancelButton:true
  }).then(r=>{
    if (!r.isConfirmed) return;
    $.ajax({
      url:`${API_URL}/api/grupos/${id}`,
      method:"DELETE",
      success:()=>{
        dtGrupos.ajax.reload();
        loadGruposSelects();
        Swal.fire("Eliminado","Grupo eliminado","success");
      }
    });
  });
}

function editarClase(id) {
  $.get(`${API_URL}/api/clases`, function(all){
    const c = all.find(x => x.id_clase==id);
    $('#claseId').val(c.id_clase);
    $('#clase_nombre').val(c.nombre_clase);
    $('#clase_docente').val(c.id_docente);
    $('#clase_grupo').val(c.id_grupo);
    $('#tituloClase').text("Editar Clase");
    $('#modalClase').modal('show');
  });
}

function eliminarClase(id) {
  Swal.fire({
    title: "¿Eliminar clase?",
    showCancelButton: true
  }).then(r=>{
    if (!r.isConfirmed) return;
    $.ajax({
      url: `${API_URL}/api/clases/${id}`,
      method:"DELETE",
      success:()=>{
        dtClases.ajax.reload();
        Swal.fire("Eliminado","Clase eliminada","success");
      }
    });
  });
}

$("#modalDocente").on("show.bs.modal", function () {
    if (!$("#docenteId").val()) {
        $("#tituloDocente").text("Agregar Docente");
        $("#docente_nombre").val("");
        $("#docente_apellido").val("");
        $("#docente_email").val("");
        $("#docente_rol").val("docente");
    }
});

$("#formDocente").submit(function(e){
    e.preventDefault();
$(document).on("click", "[data-bs-target='#modalDocente']", function () {

    console.log("→ MODO AGREGAR DOCENTE");

    $("#docenteId").val("");

    $("#docente_nombre").val("");
    $("#docente_apellido").val("");
    $("#docente_email").val("");
    $("#docente_rol").val("docente");

    $("#tituloDocente").text("Agregar Docente");
});


    let id = $("#docenteId").val();
    let data = {
        nombre: $("#docente_nombre").val(),
        apellido: $("#docente_apellido").val(),
        email: $("#docente_email").val(),
        rol: $("#docente_rol").val(),
        password_hash: "123456"  
    };

    let method = id ? "PUT" : "POST";
    let url = id ? `${API_URL}/api/usuarios/${id}` : `${API_URL}/api/usuarios`;

    $.ajax({
        url: url,
        method: method,
        data: JSON.stringify(data),
        contentType: "application/json",
        success: function(){
            $("#modalDocente").modal("hide");
            dtDocentes.ajax.reload();
            Swal.fire("Éxito", id ? "Docente actualizado" : "Docente agregado", "success");
        },
        error: function(){
            Swal.fire("Error", "No se pudo guardar el docente", "error");
        }
    });
});

function editarDocente(id) {

  $("#docenteId").val(id);

  $.get(`${API_URL}/api/usuarios`, function(lista){
    
      const d = lista.find(x => x.id_usuario == id);
      if(!d){
        Swal.fire("Error", "Docente no encontrado", "error");
        return;
      }

      $("#tituloDocente").text("Editar Docente");
      $("#docente_nombre").val(d.nombre);
      $("#docente_apellido").val(d.apellido);
      $("#docente_email").val(d.email);
      $("#docente_rol").val(d.rol);

      $("#modalDocente").modal("show");
  });
}

function eliminarDocente(id) {

    Swal.fire({
        title: "¿Eliminar docente?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Eliminar",
        cancelButtonText: "Cancelar"
    }).then(r => {

        if (!r.isConfirmed) return;

        $.ajax({
            url: `${API_URL}/api/usuarios/${id}`,
            method: "DELETE",
            success: function(){
                dtDocentes.ajax.reload();
                Swal.fire("Eliminado", "El docente fue eliminado", "success");
            },
            error: function(){
                Swal.fire("Error", "No se pudo eliminar el docente", "error");
            }
        });

    });
}

function recargarTodo() {
  dtAlumnos.ajax.reload();
  dtGrupos.ajax.reload();
  dtClases.ajax.reload();
  dtDocentes.ajax.reload();
  loadGruposSelects();
  loadDocentesSelects();
}
