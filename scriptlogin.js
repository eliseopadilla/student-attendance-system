const API = "https://unentered-unsteadily-nona.ngrok-free.dev/api/usuarios";

document.getElementById("btnLogin").addEventListener("click", login);

async function login(){
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const msg = document.getElementById("msg");

    if(!email || !password){
        msg.textContent = "Completa todos los campos";
        msg.style.color = "red";
        return;
    }

    try{
        const res = await fetch(API);
        const usuarios = await res.json();
        const user = usuarios.find(u => 
            u.email.trim().toLowerCase() === email.toLowerCase() && 
            u.password_hash.trim() === password
        );

        if(!user){
            msg.textContent = "Correo o contraseña incorrectos";
            msg.style.color = "red";
            return;
        }

        localStorage.setItem("usuario", JSON.stringify(user));
        
        msg.textContent = "Ingresando...";
        msg.style.color = "green";

        const rol = user.rol.trim().toLowerCase();
        console.log("ROL DETECTADO:", rol); 

        if(rol === "admin"){
            window.location.href = "adminIndex.html";
        } else if(rol === "docente"){
            window.location.href = "maestroIndex.html";
        } else {
            alert("Rol no reconocido en la base de datos. Verificar campo 'rol'.");
        }

    }catch(e){
        msg.textContent = "Error de conexión con el servidor";
        msg.style.color = "red";
        console.error("Error:", e);
    }
}
