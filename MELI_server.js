/* Mercadolibre usa OAuth2, que es una especie de intento de normalización de los mecanismos de autenticación, de manera que sea posible utilizar los recursos de un sitio en otro, cuando el primero de esos sitios entregó poderes de consulta a un usuario.

El mecanismo de autenticación es el siguiente:
1) Nuestra app tiene que tener una pantalla de login, con un link prearmado hacia mercadolibre, que tiene que permitir al usuario ingresar a su cuenta de mercadolibre y autorizar a nuestra app a usar su cuenta para hacer consultas a la API de mercadolibre. El link prearmado tiene que ser de mercadolibre (https://mercadolibre...), porque sino nosotros (u otro) podría capturar los datos del usuario, y eso es un problema. Pero mercadolibre tiene que saber a dónde mandar al usuario una vez que puso correctamente su usuario y contraseña.

Ese link prearmado contiene el "client_id" o "app_id" y el "redirect_uri".
El app_id se obtiene directo de mercadolibre. Mercadolibre nos asigna un app_id para que podamos identificar a nuestra aplicación, una vez que la registramos. Los usuarios comunes de nuestra aplicación deberán dar permiso a la misma, para que se conecte a mercadolibre utilizando las credenciales del usuario.

El redirect_uri es la página a la que, una vez autenticado en la página de mercadolibre, el usuario es llevado. Esto es configurado también en el portal de la api de mercadolibre: Es mercadolibre quien tiene que mandar al usuario en nuestra dirección nuevamente una vez que terminó la autenticación y la autorización.

Por ahora, configuren a redirect_uri como "http://localhost:8081/logued_in", y lo mismo a la uri de callback que mercadolibre les pide en la pantalla.

En general, usar http en lugar de https está prohibido, pero para localhost (nuestra propia compu), está permitido, porque se sabe que es con fines de prueba, en general. ¿Por qué está prohibido? Porque con el auth code y algunos datos más, que seguramente no están protegidos adecuadamente, un man-in-the-middle podría autenticarse con el usuario que se acaba de loguear en mercadolibre, simplemente mirando la URL a la que mercadolibre lo envió tras su autenticación (sería capaz de leer el auth_code!). ¿Se acuerdan de las clases de crypto? :D

La App_id la obtienen de la misma página donde registraron la nueva aplicación.

2) Cuando el usuario es enviado nuevamente en nuestra dirección, mercadolibre en realidad agrega parámetros GET, que nosotros tenemos que capturar. En particular, nos da un ćodigo de autenticación, un "auth_code". 

En particular a nosotros, con este script y la configuración que les dije, mandaría al usuario a
http://localhost:8081/logued_in?code=CODIGO_DE_AUTENTICACION

donde CODIGO_DE_AUTENTICACION es un código generado por mercadolibre que nos permitirá luego, sin que el usuario tenga que entender lo que está pasando, negociar con mercadolibre un "token" o una "posta", para actuar en nombre del usuario. La idea de este script es terminar obteniendo ese token.

Entonces, en resumen,es necesario capturar ese código de autenticación.

3) Hay que enviar un mensaje al servidor de mercadolibre con el código de autenticación, para que nos entregue el token. El problema es que también requiere de otros datos, entre los que figura el grant_type (que es básicamente de qué forma queremos obtener acceso), el redirect_uri (el mismo que configuramos en la api de mercadolibre), el client_id o app_id (el que nos asignó mercadolibre) y el client_secret (que también nos asignó mercadlibre y que debería ser secreto).

Cuando le enviamos, mediante un mensaje POST, a mercadolibre el authenticacion code junto con todos esos datos, mercadolibre nos va a responder con un token.

Noten que la comunicación con mercadolibre es mediante URLs (GETs) y mensajes POST. Por eso, se dice que es una API REST o API RESTful. Debería ser muy sencillo, pero Nodejs nos la complica un poco.

En el código que les mando, lo que hago es crear un servidor para poder tener una página con un botón que nos mande al autenticador de mercadolibre (el paso 1), y espero mensajes en una url especial, https://localhost:8081/logued_in, donde, cuando recibo un mensaje, me robo el authentication code para poder irme a negociar con mercadolibre un token.

Voy a intentar explicar el código tanto como pueda.

Necesitan haber leído la documentación de mercadolibre sobre cómo autenticar en una estructura de servidor: https://developers.mercadolibre.com.ar/es_ar/server-side#Flujo-Server-Side */


//=====================================================
/// === IMPORTAMOS MÓDULOS ============================+
// Nos traemos express, que es todo un framework para armar aplicaciones web.
var express = require('express');
var app = express(); // Creamos una instancia de express, y la llamamos app.

// Queremos ver si podemos comparar algunas cookies. Esto no me salió bien aún.
var cookieParser = require('cookie-parser') 

// Los datos de acceso están en un archivo aparte, que se llama datos de acceso, y que NUNCA voy a mandar al repositorio (al menos, no sin encriptarlo). Por eso lo dejo aparte.
var datos_acceso = require('./datos_acceso')

// Vamos a necesitar mandar mensajes http. Estos dos módulos nos sirven para eso:
var http = require('http');
var request = require('request')
var ubicacion = require('./Ubicacion')
var unavariable;
var token;
var fs = require ('fs')


// Para poder jugar con las cookies después, vamos a tener que usar el módulo en la app. Es como una extensión.
app.use(cookieParser())
module.exports = {
    token: token,
}

const cors = require('cors')
app.use(cors())

//=====================================================


//=====================================================
// ====== GUARDO DATOS QUE VOY A NECESITAR LUEGO ======
// ==== LEER ESTO ÚLTIMO PORQUE ES DEL ÚLTIMO PASO ====


// Estos valores los voy a usar para pedir el token. Los guardo en un diccionario.
// Fijense cómo es que pido los datos que quiero mantener fuera del repositorio. datos_acceso es la variable a la que asigné el require del archivo que se llama datos_acceso.js más arriba.
// Los valores que necesito los conozco porque mercadolibre me dice cómo tiene que ser el POST que envíe (aunque de una forma bastante poco práctica) en la documentación: https://developers.mercadolibre.com.ar/es_ar/server-side#Flujo-Server-Side
// dice:
// https://api.mercadolibre.com/oauth/token?grant_type=authorization_code&client_id=APP_ID&client_secret=SECRET_KEY&code=SERVER_GENERATED_AUTHORIZATION_CODE&redirect_uri=REDIRECT_URI
//
// y todo lo que está detrás del "?" son parámetros.
var valores = {"grant_type":"authorization_code",
    "client_id": datos_acceso.client_id,
    "client_secret": datos_acceso.client_secret,
    "redirect_uri": datos_acceso.redirect_uri,
    "code": ""}; // el code aún está vacío.

// Opciones que voy a tener que usar al momento de hacer el pedido del Token por mensaje POST.
var options = {
   url:'https://api.mercadolibre.com/oauth/token', //Lo sé por la URL de arriba.
   form: valores, //Estos son los valores que armé arriba.
   method: "POST",
   headers: {
    'Content-Type': 'application/x-www-form-urlencoded', //Estoy enviando los valores codificados en la URL (Están todos los datos en la URL)
    'Accept': 'application/json' //Espero que me devuelva un json!
   }
};

// Funcion de callback que es la que es llamada cuando el servidor de mercadolibre me responda con el token. Lo que voy a hacer es mostrar el json en la consola, ustedes después verán qué hacen.


var preguntarAML = function(error,response,body) {
    console.log(body); //El body es lo que tiene la data, el json del token!
    console.log(error); //Debería ser null si no hay error.
    token = JSON.parse(body);
    fs.writeFile('token.txt', body, function (err) {
       if (err) throw err;
    });
    //console.log(token.access_token);
}

// === ACÁ TERMINA LO QUE TENÍAN QUE LEER ÚLTIMO ======
//=====================================================



// =============== ROUTING ============================
// Routing no es más que un nombre pomposo para indicar
// que dependiendo de la URL que me pidan, voy a hacer distintas acciones.

// Acá está lo que pasa si alguien pide entrar a http://localhost:8081/index.html mediante un mensaje GET (el común de un navegador). Noten la estructura: El segundo parámetro de "app.get" es una función (anónima, nunca le pusimos nombre) que recibe como parámetro un req (por request) y un res (por response). El 'req' me podría servir si me interesan los parámetros con los que entraron (esas cosas que vienen después del "?" en esas urls que están arriba). El res es lo que pensamos mandar.
//Fijense que lo que se hace es mandar el archivo index.html que está en el mismo directorio que este script de node.
app.get('/index.html', function (req, res) {
    res.sendFile( __dirname + "/" + "index.html" ); //mando el html
    //Acá calculo un número random para una comparación de cookies. No presten atención.
    var uuid_sesion = (Math.random() * (1 - 200) + 200).toString()
    res.cookie('session_id', uuid_sesion, { maxAge: 900000, httpOnly: true });
    // Imprimo el número random que salió, para comprar eventualmente.
    console.log('uuid_sesion: '+uuid_sesion)
})

// Acá indico qué hago cuando alguien le pega a http://localhost:8081/logued_in con un get. Fijensé que acá sí uso el 'req', porque me interesan los parámetros con los que llega el get. ¿Por qué? Porque a esta página es a la que me manda mercadolibre una vez que el usuario se pudo autenticar. Y me manda, según la documentación, con esta forma:
// http://YOUR_REDIRECT_URI?code=SERVER_GENERATED_AUTHORIZATION_CODE
// el redirect_uri es el que configuramos en la página de aplicaciones de mercadolibre.
// El código de autenticación es el que queremos guardar porque es el que nos va a permitir pedirle a mercadolibre el token!
app.get('/logued_in', function (req, res) {
    session_cookie = req.cookies['session_id'] //pido las cookies del usuario
    console.log(session_cookie); // imprimo la cookie para ver
    
    if (req.query.error != null){ // si hubo error, mostrame!
        console.log('error '+req.query.error)
    };

    // Me quedo con el code! Es code porque es lo que está antes del = y después del "?" en el GET (http://YOUR_REDIRECT_URI?code=SERVER_GENERATED_AUTHORIZATION_CODE)
    valores.code = req.query.code // ME GUARDO EL CÓDIGO!
    console.log('codigo acceso:\n') // Lo muestro!
    console.log(valores.code)
    console.log('pido token\n')

    // Hago el post para pedir el token! ¿Cómo hago?
    // Fácil: Las options que armé arriba  del todo tienen todos los datos necesarios, menos el código de autenticación.
    // Pero al código de autenticación lo acabo de obtener!
    // preguntarAML es una función con un nombre feo. Es la función de callback: Qué va a hacer cuando termino el post: Esperar a que llegue data. Está definida más arriba, y básicamente lo que hace es imprimir lo que devuelve, que es el json del token.

    var req = request.post(options, preguntarAML);
    res.send('hecho') //Escribo hecho en la página.

    
})

app.get('/valoraciones', function(req, res) {
    ubicacion.valoraciones(req, res);
    //console.log (this.valoraciones.seller_reputation.transactions.ratings)
    
} )

app.get('/BMap', function(req, res) {
    ubicacion.BMap(req, res);
    //console.log (this.valoraciones.seller_reputation.transactions.ratings)
    
} )

app.post('/categories',function(req,res){
    console.log(req.body.category);
    var cat = req.body.category;
    var url = 'https://api.mercadolibre.com/categories/' + cat
    request.get({url: url}, function (error, response, body) {
        var catName = JSON.parse(body);
        res.send(catName.name)
    })
});	
// ===== END ROUTING =====

// Levanto el server en express en el puerto 8081.
var server = app.listen(8081, function () {
    var host = server.address().address
    var port = server.address().port
    console.log("Server de MercadoLibre4AO, en http://%s:%s", host, port)
})