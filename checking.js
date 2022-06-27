// checking.js

"use strict";

var videoids_to_check =  [],
    responses         =  [],
    failures          =  [],
    valid_IDs         =  [],
    space_padding     =   0,
    total_to_check    =   0,
    last_valid_amount =   0,
    queries_per_check = 100,
    update_timeout    =  -1;

elems.i2_btn1 .addEventListener( "click" , prepare_check );
elems.i2_qperc.addEventListener( "change", update_qperc  );
elems.i2_btn2 .addEventListener( "click" , check_queries );
elems.i2_btn3 .addEventListener( "click" , readd_fails   );

// Based on https://stackoverflow.com/a/9229821
// Changed to be slightly faster, BUT changes order of array (should reverse it)
function uniq( a ){
	var seen = {}, out = [], len = a.length, j = 0;
	for( var i = len; i--; ){
		var item = a[ i ];
		if( seen[ item ] !== undefined )
			continue;
		seen[ item ] =    1;
		out [ j++  ] = item;
	}
	return out;
}

function css_bar( elem, percent_str ){
	elem.style.backgroundImage = `linear-gradient(90deg, #777 ${percent_str}%, #000 0%)`;
}

function update_o2_check(){
	function padded( arr ){
		return arr.length.toString().padStart( space_padding );
	}
	function padded_num( num ){
		return num.toString().padStart( space_padding );
	}
	elems.o2_check.innerText = `
videoIDs : ${padded( videoids_to_check )}
Responses: ${padded( responses         )}
Failures : ${padded( failures          )}
Valid IDs: ${padded( valid_IDs         )}
`.slice( 1, -1 );
	var percent_str = ( ( total_to_check - videoids_to_check.length ) / total_to_check * 100 ).toFixed( 2 );
	elems.o2_pbar .innerText = `${padded( videoids_to_check )} / ${padded_num( total_to_check )} (${percent_str.padStart(6)}%)`;
	css_bar( elems.o2_pbar, percent_str );
	if( valid_IDs.length !== last_valid_amount )
		update_o2_valid();
}

function update_o2_valid(){
	var valid_links = valid_IDs.map( id => `<a href="https://www.youtube.com/watch?v=${id}" target="_blank">${id}</a>` ).join( "\n" );
	elems.o2_valid.innerHTML = `Valid IDs:
----------
${valid_links}`;
	last_valid_amount = valid_IDs.length;
}

function prepare_check(){
	videoids_to_check = uniq( videoids );
	total_to_check    = videoids_to_check.length;
	space_padding     = Math.ceil( Math.log10( total_to_check ) );
	update_o2_check();
}

function update_qperc(){
	queries_per_check = parseInt( get_val( "i2_qperc" ) );
	if( queries_per_check <= 0 || isNaN( queries_per_check ) )
		queries_per_check = 100;
	set_val( "i2_qperc", queries_per_check );
}

function check_queries(){
	for( var i = queries_per_check; i-- && videoids_to_check.length > 0; )
		gapi_exec( videoids_to_check.splice( 0, 50 ) );
	schedule_update_o2();
}

function readd_fails(){
	videoids_to_check = videoids_to_check.concat( failures );
	failures = [];
	update_o2_check();
}

function schedule_update_o2(){
	if( update_timeout === -1 )
		window.clearTimeout( update_timeout );
	update_timeout = window.setTimeout( update_o2_check, 100 );
}

function gapi_exec( id_array ){
	return gapi.client.youtube.videos.list( { part: [ "id" ], id: id_array } ).then(
		r => {
			responses.push( r );
			for( var item of r.result.items ){
				valid_IDs.push( item.id );
			}
			schedule_update_o2();
		},
		e => { 
			failures = failures.concat( id_array );
			console.error( "Execute error", e );
			schedule_update_o2();
		}
	);
}

