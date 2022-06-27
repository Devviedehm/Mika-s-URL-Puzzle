// setup.js

"use strict";

/*
Valid URLs:
Have exactly 11 characters (at least for the foreseeable future).
C1 to C10 are included in this base64 dictionary:
ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_
C11 is limited to the following:
AEIMQUYcgkosw048

Or simply this RegEx, as per this link:
https://webapps.stackexchange.com/a/101153
videoId  : [0-9A-Za-z_-]{10}[048AEIMQUYcgkosw]
*/

var elems    = {}            ,
    options  = new Array( 8 ),
    permuts  = []            ,
    videoids = []            ;

const swaps = [
	[ "\\a", `!` ], [ "\\A", `,` ],
	[ "\\b", `#` ], [ "\\B", `$` ],
	[ "\\c", `%` ], [ "\\C", `&` ],
	[ "\\d", `~` ], [ "\\D", `(` ],
	[ "\\e", `)` ], [ "\\E", `|` ],
	[ "\\f", `?` ], [ "\\F", `+` ],
	[ "\\g", `@` ], [ "\\G", `:` ],
	[ "\\h", `;` ], [ "\\H", `.` ]
];

for( var id of [
	"i_apikey", "i_chara1", "i_chara2", "i_chara3",
	"i_chara4", "i_chara5", "i_chara6", "i_chara7",
	"i_chara8", "i_btn1"  , "o_btn1"  , "i_btn2"  ,
	"o_btn2"  , "i_btn3"  , "o_btn3"  , "i_format",
	"o_format",
	"i2_btn1" , "o2_check", "o2_pbar" , "i2_qperc",
	"i2_dis1" , "i2_btn2" , "i2_btn3" , "o2_valid"
] )
	elems[ id ] = document.getElementById( id );

function get_val( elem_name          ){ return elems[ elem_name ].value              ; }
function set_val( elem_name, new_val ){        elems[ elem_name ].value     = " " + new_val; }
function set_txt( elem_name, new_txt ){        elems[ elem_name ].innerText = " " + new_txt; }
function set_err( elem_name, new_err ){
	elems[ elem_name ].innerText = " " + new_err;
	var err_span = document.createElement( "span" );
	err_span.style = "font-weight:bold;color:red;"
	err_span.innerText = " Error!";
	elems[ elem_name ].prepend( err_span );
}

elems.i_btn1  .addEventListener( "click" , set_api_key   );
elems.i_btn2  .addEventListener( "click" , generate_list );
elems.i_format.addEventListener( "change", format_demo   );
elems.i_btn3  .addEventListener( "click" , convert_array );

function set_api_key(){
	if( gapi.client === undefined )
		return set_err( "o_btn1", "No GAPI; local file?" );
	gapi.client.setApiKey( get_val( "i_apikey" ) );
	gapi.client.load( "https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest" ).then(
		_ => { set_txt( "o_btn1", "GAPI loaded"   );                   },
		e => { set_err( "o_btn1", "Check console" ); console.log( e ); }
	);
}

function generate_list(){
	function make_valid_b64( string ){
		return string.replaceAll( /[^a-zA-Z0-9\-_]/g, "" );
	}
	function make_valid_lastchar( string ){
		return string.replaceAll( /[^048AEIMQUYcgkosw]/g, "" );
	}
	function recursive( N, str ){
		if( N === 8 ){
			permuts.push( str );
			return;
		}
		for( var char of options[ N ] ){
			// We assume that the code doesn't use different symbols for the same letters.
			// For example, we won't consider C2 is Z if C1 is already Z.
			if( str.includes( char ) )
				continue;
			recursive( N + 1, str + char + char.toUpperCase() );
		}
	}
	var elem;
	// Remove anything that isn't part of the base64 and, in C8's case, not part of the acceptable characters.
	for( var i = 0; i < 7; i++ ){
		elem         = elems[ "i_chara" + ( i + 1 ) ];
		options[ i ] = elem.value = make_valid_b64( elem.value )
	}
	elem         = elems[ "i_chara8" ];
	options[ 7 ] = elem.value = make_valid_lastchar( elem.value );
	permuts = [];
	recursive( 0, "" );
	set_txt( "o_btn2", `${permuts.length} permutations` );
}


function get_valid_formats( string ){
	// Ensure we only have b64 AND the backslash character.
	string = string.replaceAll( /[^a-zA-Z0-9\-_\\]/g, "" );
	// Replace proper escaped characters with unused symbols.
	for( var [ find, replace ] of swaps )
		string = string.replaceAll( find, replace );
	// Remove extraneous backslashes.
	var symstr = string = string.replaceAll( "\\", "" );
	// Restore proper backslashes.
	for( var [ replace, find ] of swaps )
		string = string.replaceAll( find, replace );
	return { string, symstr };
}

function format_demo(){
	/*
	Generating the videoId code, the default format is aAbcDEcFggh, represented as:
	\a\A\b\c\D\E\c\F\g\g\h
	To always force the format to end with "27a", for example, can use:
	\a\A\b\c\D\E\c\F27a
	*/
	var { string, symstr } = get_valid_formats( get_val( "i_format" ) );
	set_val( "i_format", string );
	for( var [ replace, find ] of swaps ){
		replace = replace.slice( 1 );
		symstr = symstr.replaceAll( find, `<span class="symbol_${replace}">${replace}</span>` );
	}
	elems.o_format.innerHTML = symstr;
}

function convert_array(){
	var format = get_valid_formats( get_val( "i_format" ) ).symstr;
	var pos = new Array( 16 ).fill().map( _ => [] );
	for( var i = 0; i < 16; i++ ){
		for( var j = 0; j < format.length; j++ )
			if( format[ j ] === swaps[ i ][ 1 ] )
				pos[ i ].push( j );
	}
	var videoID = new Array( 11 );
	videoids = permuts.map( code => {
		for( var i = 16; i--; )
			for( var j = pos[ i ].length; j--; )
				videoID[ pos[ i ][ j ] ] = code[ i ];
		return videoID.join( "" );
	} );
	set_txt( "o_btn3", videoids.length + " videoIDs" );
}
