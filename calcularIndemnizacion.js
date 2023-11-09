// Definición de variables para almacenar resultados parciales y el resultado final
let antiguedad = 0;
let preaviso = 0;
let sacpreaviso = 0;
let diasMesExtincion = 0;
let SACProporcional = 0;
let resultadoFinal = 0;
let integracionmesDespido = 0;
let SACintegracionmesDespido = 0;
let indemnizacionVacaciones = 0;
let SACVacaciones = 0;
let diferenciaMeses = 0;



// Función para realizar la validación antes de calcular
function validarFormulario() {
    // Recopilar el valor del correo electrónico
    const email = document.getElementById("email").value;

    // Validar si el correo electrónico está presente y es válido
    if (email.trim() === "") {
        alert("El campo de correo electrónico es obligatorio.");
        return false;
    } else if (!validarEmail(email)) {
        alert("El correo electrónico no es válido. Ingresa una dirección de correo válida.");
        return false;
    }

    // Si el correo electrónico es válido, puedes continuar con el cálculo
    calcularIndemnizacion();
}

// Función para calcular la indemnización
function calcularIndemnizacion() {
		
    // Recopilar los valores ingresados por el usuario
    const mrmnh = parseFloat(document.getElementById("mrmnh").value);
    const fechaIngreso = fixDate(document.getElementById("fecha-ingreso").value);    
    const fechaEgreso = fixDate(document.getElementById("fecha-egreso").value);
    const tipoLiquidacion = document.getElementById("causal").value;
    const preavisoSeleccionado = document.getElementById("preaviso").checked;
    const email = document.getElementById("email").value;

	diferenciaMeses = calcularDiferenciaMeses(fechaIngreso, fechaEgreso);

	// Días trabajados mes de extinción del contrato
  	diasMesExtincion = calcularDiasTrabajadosMesExtincion(mrmnh, fechaEgreso);
  	//
  	SACProporcional = calcularSACProporcionalSemestre(mrmnh, fechaEgreso);
  
  	indemnizacionVacaciones = calcularIndemnizacionVacacionesNoGozadas(mrmnh, calcularDiferenciaMeses(fechaIngreso, fechaEgreso));
  
  	SACVacaciones = parseFloat(indemnizacionVacaciones / 12).toFixed(2);
  	
  	integracionmesDespido = calcularIntegracionMesDespido(mrmnh, fechaEgreso);
  	
  	SACintegracionmesDespido = parseFloat(integracionmesDespido / 12).toFixed(2);
  	
  	    // Antiguedad
    antiguedad = calcularAntiguedad(mrmnh, diferenciaMeses);
    // Preaviso
    if (!preavisoSeleccionado){
		preaviso = calcularPreaviso(mrmnh, diferenciaMeses);
		// SAC s/ preaviso
		sacpreaviso = parseFloat(preaviso / 12).toFixed(2);
	}else { 
		preaviso=0;
		sacpreaviso=0;
	}
    

    // Calcular el resultado final
    resultadoFinal = calcularResultadoFinal(tipoLiquidacion);
    // Mostrar los resultados en la página
    mostrarResultados();

    // Persistir datos en la base de datos de Wix
    persistirEnBaseDeDatos();

    // Enviar el correo electrónico
    enviarCorreo(email);
}

// Función para calcular el resultado final
function calcularResultadoFinal(tipoLiquidacion) {
    // Calcular la suma de las variables sin redondear
    let liquidacionFinal = parseFloat(diasMesExtincion) + parseFloat(SACProporcional) 
    + parseFloat(indemnizacionVacaciones) + parseFloat(SACVacaciones);
    let indemnizacion = parseFloat(antiguedad) + parseFloat(preaviso) 
    + parseFloat(sacpreaviso) + parseFloat(integracionmesDespido) 
    + parseFloat(SACintegracionmesDespido);
	let resultadoNumerico = 0;
    // Aplicar la lógica según el tipo de liquidación
    switch (tipoLiquidacion) {
        case "LF":
            resultadoNumerico = liquidacionFinal;
            break;
        case "LP":
			resultadoNumerico = liquidacionFinal + (indemnizacion * 0.5);
            break;
        default:
            resultadoNumerico = liquidacionFinal + indemnizacion;
            break;
    }

    // Redondear el resultado a 2 decimales y convertirlo a cadena
    resultadoFinal = resultadoNumerico.toFixed(2);

    // Retornar el resultado
    return resultadoFinal;
}

// Función para mostrar los resultados en la página
function mostrarResultados() {
    const resultadoHTML = `
        <h2>Resultados Parciales:</h2>
        <p>Antigüedad: ${antiguedad}</p>
        <p>Preaviso: ${preaviso}</p>
        <p>SAC s/ Preaviso: ${sacpreaviso}</p>
        <p>Días trabajados mes de extinción: ${diasMesExtincion}</p>
        <p>SAC Proporcional: ${SACProporcional}</p>
        <p>Integración mes de despido: ${integracionmesDespido}</p>
        <p>SAC s/ Integración mes de despido: ${SACintegracionmesDespido}</p>
        <p>Indemnización de Vacaciones: ${indemnizacionVacaciones}</p>
        <p>SAC s/ Vacaciones: ${SACVacaciones}</p>
        <h2>Resultado Final:</h2>
        <p>La indemnización calculada es: ${resultadoFinal}</p>
    `;
    document.getElementById("result").innerHTML = resultadoHTML;
}


// Función para calcular la antigüedad (resultado parcial 1)
function calcularAntiguedad(mrmnh, diferenciaMeses) {
    if (diferenciaMeses >= 3) {
        const diasExtras = diferenciaMeses % 12; // Calcular los meses adicionales
        const antiguedadAnios = Math.floor((diferenciaMeses) / 12) + (diasExtras > 0 ? 1 : 0); // Calcular los años de antigüedad
        return (Math.max(antiguedadAnios * mrmnh, mrmnh)).toFixed(2); // La indemnización no puede ser inferior a un mes de MRMNH
    } else {
        // Si la antigüedad es inferior a 3 meses, no corresponde indemnización
        return 0;
    }
}

// Función para calcular el preaviso
function calcularPreaviso(mejorsueldo, diferenciaMeses) {
	let resultado = 0;
    // Lógica para calcular el preaviso según los requisitos
    if (diferenciaMeses < 3) {
        // Menos de 3 meses: Medio MRMNH
        resultado = mejorsueldo / 2;
    } else if (diferenciaMeses <= 60) {
        // Hasta 5 años (60 meses): 1 MRMNH
        resultado = mejorsueldo;
    } else {
        // Más de 5 años: 2 MRMNH
        resultado = mejorsueldo * 2;
    }
    return resultado.toFixed(2);
}

// Función para calcular los días trabajados en el mes de extinción del contrato (resultado parcial 4)
function calcularDiasTrabajadosMesExtincion(mrmnh, fechaEgreso) {
//    // Obtener el último día del mes de extinción del contrato
    const ultimoDiaMesExtincion = new Date(fechaEgreso.getFullYear(), fechaEgreso.getMonth() + 1, 0).getDate();

    // Calcular los días efectivamente trabajados en el mes de extinción
    const diasTrabajados = (mrmnh / ultimoDiaMesExtincion) * fechaEgreso.getDate();

    return diasTrabajados.toFixed(2);
}

// Función para calcular el SAC proporcional al semestre en curso (resultado parcial 5)
function calcularSACProporcionalSemestre(mrmnh, fechaEgreso) {
    // Obtener el año y mes de egreso
    const anioEgreso = fechaEgreso.getFullYear();
    const mesEgreso = fechaEgreso.getMonth() + 1; // Sumamos 1 ya que los meses van de 0 a 11

    // Calcular el número de días transcurridos en el semestre en curso
    let diasTranscurridos = 0;

    if (mesEgreso >= 1 && mesEgreso <= 6) {
        // Primer semestre (enero a junio)
        diasTranscurridos = fechaEgreso.getDate(); // Días trabajados en el mes de egreso
    } else {
        // Segundo semestre (julio a diciembre)
        const ultimoDiaJunio = new Date(anioEgreso, 6, 30).getDate(); // Último día de junio
        diasTranscurridos = ultimoDiaJunio + fechaEgreso.getDate(); // Días trabajados en el mes de egreso más días completos del primer semestre
    }

    // Calcular el SAC proporcional
    const sacProporcional = (mrmnh / 365) * diasTranscurridos;

    return sacProporcional.toFixed(2);
}

// Función para calcular la integración del mes de despido (resultado parcial 6)
function calcularIntegracionMesDespido(mrmnh, fechaEgreso) {
    // Obtener el año y mes de egreso
    const anioEgreso = fechaEgreso.getFullYear();
    const mesEgreso = fechaEgreso.getMonth() + 1; // Sumamos 1 ya que los meses van de 0 a 11

    // Calcular el último día del mes
    const ultimoDiaMes = new Date(anioEgreso, mesEgreso, 0).getDate();

    // Calcular los días faltantes en el mes de despido
    const diasFaltantes = ultimoDiaMes - fechaEgreso.getDate();

    // Calcular la integración del mes de despido
    const integracionMesDespido = (mrmnh / ultimoDiaMes) * diasFaltantes;

    return integracionMesDespido.toFixed(2);
}


function calcularIndemnizacionVacacionesNoGozadas(sueldo, diferenciaMeses) {
    // Calcular el plazo de licencia en función del tiempo trabajado
    let plazoLicencia = 0;

    if (diferenciaMeses >= 6) {
        // Más de 6 meses, se toman los plazos estándar
        if (diferenciaMeses < 12) {
            plazoLicencia = 14;
        } else if (diferenciaMeses < 60) {
            plazoLicencia = 21;
        } else if (diferenciaMeses < 120) {
            plazoLicencia = 28;
        } else {
            plazoLicencia = 35;
        }
    } else {
        // Menos de 6 meses, se estima 1 día por mes
        plazoLicencia = Math.floor(diferenciaMeses);
    }

    // Calcular la indemnización de vacaciones no gozadas
    const indemnizacionVacaciones = (sueldo / 25) * plazoLicencia;

    return indemnizacionVacaciones.toFixed(2);
}


// Función para calcular la diferencia en meses entre dos fechas
function calcularDiferenciaMeses(fechaInicio, fechaFin) {
    const aniosDiferencia = fechaFin.getFullYear() - fechaInicio.getFullYear();
    const mesesDiferencia = fechaFin.getMonth() - fechaInicio.getMonth();
    const diasInicio = fechaInicio.getDate();
    const diasFin = fechaFin.getDate();

    // Ajuste para tener en cuenta los días sueltos
    let diferenciaMeses = aniosDiferencia * 12 + mesesDiferencia;

    // Verificar si hay días sueltos
    if (diasFin < diasInicio) {
        diferenciaMeses--;
    }

    return diferenciaMeses;
}

function fixDate(fechaStr){
    const [year, month, day] = fechaStr.split('-');
    return new Date(year, month - 1, day);

}	


// Función para validar el correo electrónico
function validarEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    return emailRegex.test(email);
}

// Función para persistir datos en la base de datos de Wix
function persistirEnBaseDeDatos() {
    // Lógica para persistir los datos en la base de datos de Wix (ajusta esto según tus necesidades)
    const tipoLiquidacion = document.getElementById("causal").getAttribute("data-tipo-liq");
    // Aquí puedes usar la variable "tipoLiquidacion" para guardar en la base de datos de Wix
}

// Función para enviar el correo electrónico
function enviarCorreo(email) {
    // Lógica para enviar el correo electrónico (ajusta esto según tus necesidades)
    // Utiliza la variable "email" para enviar el resultado al correo proporcionado
}