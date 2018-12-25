CALL algo.labelPropagation(
  'MATCH (p:paragraph) RETURN id(p) as id, p.weight as weight, id(p) as value',
'MATCH (p1:paragraph)-[]->(c:concept)<-[]-(p2:paragraph)   RETURN id(p1) as source, id(p2) as target, c.weight as weight',
  "OUT",
  {graph:'cypher',write:true});
  
  
  CALL algo.labelPropagation(
  'MATCH (p:documentCollaboratif) RETURN id(p) as id, p.weight as weight, id(p) as value',
'MATCH (p1:documentCollaboratif)-[]->(c:communaute)<-[]-(p2:documentCollaboratif)   RETURN id(p1) as source, id(p2) as target, c.weight as weight',
  "OUT",
  {graph:'cypher',write:true})
  YIELD nodes, iterations, loadMillis, computeMillis, writeMillis, write, partitionProperty;
  
  
  
  CALL algo.louvain(
  'MATCH (p:paragraph) RETURN id(p) as id',
  'MATCH (p1:paragraph)-[]->(c:concept)<-[]-(p2:paragraph)
   RETURN id(p1) as source, id(p2) as target, c.weight as weight',
  {graph:'cypher',write:true});