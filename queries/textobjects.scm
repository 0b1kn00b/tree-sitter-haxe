(class_declaration 
  body: (block) @class.inside ) @class.around

(function_declaration
  body: (block) @function.inside) @function.around

;;(function_arg name: (identifier)) @definition.parameter

;;https://github.com/helix-editor/helix/issues/2701
;;made function_arg_list visible
(function_arg_list) @parameter.inside
