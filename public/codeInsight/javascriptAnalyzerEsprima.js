
function testEsprima(){
	var input=$("#input").val();
	var syntax = esprima.parse(input,{loc:true});
	var input=$("#output").val(JSON.stringify(syntax));
		var file="test"
	var mySyntax = {

			functionDefs : [],
			functionCalls : [],
			variables : [],
			globalVariables : [],
			files : []
		};
	


		for (var i = 0; i < syntax.body.length; i++) {
			if (syntax.body[i].type == "VariableDeclaration") {
				for (var j = 0; j < syntax.body[i].declarations.length; j++) {
					var obj=syntax.body[i].declarations[j].id;
					obj.file=file;
					mySyntax.globalVariables.push(obj);
				}
			}
			if (syntax.body[i].type == "FunctionDeclaration") {
				var obj=syntax.body[i].id;
				obj.file=file;
				obj=processLoc(obj);
				mySyntax.functionDefs.push(obj);
				
				
			}

		}

		var functionCalls = grep(syntax, "type", "CallExpression");
		for (var i = 0; i < functionCalls.length; i++) {
			var obj=functionCalls[i].callee;
			if (!obj.name  || obj.name == "$")
				continue;
			obj.file=file;
			obj=processLoc(obj);
			mySyntax.functionCalls.push(obj)
		}

		;

	

	function grep(json, field, fieldValue) {
		var matches = []
		function recurse(child) {
			for ( var key in child) {
				var value = child[key];

				if (Array.isArray(value)) {
					for (var i = 0; i < value.length; i++) {
						recurse(value[i]);
					}
				} else if (value instanceof Object) {
					for ( var key2 in value) {
						recurse(value[key2]);
					}
				} else {
					if (value == fieldValue) {
						// console.log(JSON.stringify(child)+'\n')
						if (child[field] == fieldValue) {
							matches.push(child);
						}
					}

				}

			}

		}
		recurse(json);
		return matches

	}
}

function processLoc(obj){
	if(obj.loc){
		obj.startLine=obj.loc.start.line;
		obj.endLine=obj.loc.end.line;
		delete obj.loc;

	}
	return obj;
}


	
	
