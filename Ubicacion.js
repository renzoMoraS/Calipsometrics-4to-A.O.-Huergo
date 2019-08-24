var meli = require('mercadolibre');
var datos_acceso = require('./datos_acceso');
var request = require('request')
var username;

//VALORACIONES DEL VENDEDOR

var fs = require ('fs')
var token;

function isEmptyObject(obj){
	return !Object.keys(obj).length;
}
function setUser(reqDeMiGet, response){

	fs.readFile('token.txt', function (err, data) {
		if (err) throw err;
		token = JSON.parse(data)
		var meliObject = new meli.Meli(datos_acceso.client_id, datos_acceso.client_secret, token.access_token, token.refresh_token);
		//console.log(unvalor);
		//return unvalor;
		
	});
	
}
module.exports.setUser = setUser;

function valoraciones(reqDeMiGet, resDeMiGet){
	fs.readFile('token.txt', function (err, data) {
		if (err) throw err;
		token = JSON.parse(data)
		var meliObject = new meli.Meli(datos_acceso.client_id, datos_acceso.client_secret, token.access_token, token.refresh_token);
		
		var unvalor = reqDeMiGet.query.username;
		console.log(unvalor)
		console.log('lo de arriba es el nombre del usuario')
		var losdatosdelusuario;
		console.log('/sites/MLA/search?nickname='+String(unvalor));
		meliObject.get('/sites/MLA/search', {nickname: unvalor}, function (err, res) { //?attributes=seller_reputation  --> esto estaba después del user id
			if (isEmptyObject(res.results)) {
				resDeMiGet.status(501);
				resDeMiGet.send('No existe tal usuario.');
				//return
			} else {
				losdatosdelusuario = res;
				console.log('lo de arriba es el error');
				console.log(losdatosdelusuario);
				console.log('lo que está arriba son los datos del usuatio');
				meliObject.get('/users/'+ losdatosdelusuario.seller.id, function (err, res) { //?attributes=seller_reputation  --> esto estaba después del user id
					unvalor = res;
					console.log(unvalor);
					console.log('lo de arriba es la respuewsta demercadolibre')
					//unavariable = JSON.parse(unvalor);
					resDeMiGet.send(unvalor);
				});
			}
			//unavariable = JSON.parse(unvalor);
		});
		//console.log(unvalor);
		//return unvalor;
		
	});
	
}
module.exports.valoraciones = valoraciones;

function BMap(req, res){
		
	fs.readFile('token.txt', function (err, data) {
		if (err) throw err;
		token = JSON.parse(data)
		var meliObject = new meli.Meli(datos_acceso.client_id, datos_acceso.client_secret, token.access_token, token.refresh_token);

		//var murl = "https://api.mercadolibre.com/orders/search?seller="+ token.user_id +"&order.status=paid&access_token="+ token.access_token;

		meliObject.get('/orders/search', {
			seller: token.user_id,
			status: 'paid'},
			function (error, cosaenmedio, body) {
				//var orders = JSON.parse(body);
				console.log(cosaenmedio)
				
				res.send(JSON.stringify(cosaenmedio))
		})	

	});

}
module.exports.BMap = BMap;