var searchRelations = (function () {

    var self = {};
    self.currentRelations = [];







    self.initDialog = function (rels) {
        if (!Array.isArray(rels))
            rels = [rels];
        self.currentRelations = rels;
        $("#searchRelDialog_relTypeSelect option").remove();

        if (rels.length == 1) {
            common.fillSelectOptions(searchRelDialog_relTypeSelect, rels,"name","name");
            $("#searchRelDialog_relTypeSelect").val(rels[0].name);
            self.initRelProps(0);

        }
        else
            common.fillSelectOptions(searchRelDialog_relTypeSelect, rels,"name","name",true);


    }
    self.initRelProps = function (relIndex) {
        var relProps = Schema.getRelationsByType(self.currentRelations[relIndex].properties);
        relProps.splice(0,0,"numberOfRelations")


        common.fillSelectOptionsWithStringArray(searchRelDialog_propertySelect, relProps, true);
    }
    self.onRelPropsSelect = function (relIndex) {
        self.currentRelations.index = relIndex-1;
    }

    self.setRelationCriteria=function(){
        var index=$("#searchRelDialog_relTypeSelect").prop('selectedIndex');
        var relation=   self.currentRelations[index];

        relation.queryObject={
            property: $("#searchRelDialog_propertySelect").val(),
            operator: $("#searchRelDialog_operatorSelect").val(),
            value: $("#searchRelDialog_valueInput").val(),

        }

        relation.queryObject.text = (relation.queryObject.name ? relation.queryObject.name : "") + " " + relation.queryObject.property + " " + relation.queryObject.operator + " " + relation.queryObject.value;
        buildPaths.updateRelation(relation);



}

self.setEdgeColors=function(relTypes){
        context.edgeColors={}
        relTypes.forEach(function(type,index){
            context.edgeColors[type]= Gparams.relationPalette[(index% (Gparams.relationPalette.length-1))]

        })
}


    return self;
})()