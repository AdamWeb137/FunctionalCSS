#!/bin/sh

import json
import sys

def to_camel_case(hyphenated):
    while "-" in hyphenated:
        i = hyphenated.find("-")
        hyphenated = hyphenated[0:i] + hyphenated[i+1].upper() + hyphenated[i+2:]
    return hyphenated

def type_to_value_string(var_type, value):
    if var_type == 0:
        return "`"+value+"`"
    elif var_type == 1:
        return "new FCSSArg('{}')".format(value)
    elif var_type == 2:
        return "new FCSSVariable('{}')".format(value)

file_name = input("FCSS file: ").replace(".fcss","") + ".fcss"
save_name = input("Save to: ").replace(".js","") + ".js"

with open(save_name, "w") as save_file:
    write_text = ""
    depth = 0
    state = "none"

    var_name = ""
    var_value = ""
    class_name = ""
    class_params = []
    param_name = ""
    style_name = ""
    style_type = 0
    style_value = ""

    with open(file_name, "r") as fcss_file:
        whole_file = fcss_file.read()
        for i in range(len(whole_file)):
            c = whole_file[i]

            if c == "." and depth == 0:
                state = "at_class"

                if var_name != "" and var_value != "":
                    save_file.write("FCSS.SetGlobal('{}','{}');\n".format(var_name,var_value))


            if c.isalnum() or c == "_" or c == "-":
                if state == "none" or state == "globalvar":
                    state = "globalvar"
                    var_name += c
                elif state == "at_class":
                    class_name += c
                elif state == "in_class":
                    style_name += c
                elif state == "class_value":
                    style_value += c
                elif state == "var_value":
                    var_value += c
                elif state == "class_params":
                    param_name += c

            if c == "{":
                depth += 1
                state = "in_class"
                save_file.write("new FCSS (`{}`, {{\n".format(class_name))

            if c == "=":
                state = "var_value"

            if c == ";":
                if state == "var_value":
                    state = "none"
                    save_file.write("FCSS.SetGlobal(`{}`,`{}`);\n".format(var_name,var_value))

                    var_name = ""
                    var_value = ""

                elif state == "class_value":
                    state = "in_class"
                    save_file.write("   {}:{},\n".format(to_camel_case(style_name), type_to_value_string(style_type, style_value)))

                    style_name = ""
                    style_type = 0
                    style_value = ""


            if c == "}":
                state = "none"
                depth -= 1
                save_file.write("}}{});\n".format(", "+json.dumps(class_params) if len(class_params) > 0 else ""))

                class_name = ""
                class_params = []
                param_name = ""


            if c == "(" and state == "at_class":
                state = "class_params"

            if c == ")" and state == "class_params":
                state = "none"
                class_params.append(param_name)

            if c == "," and state == "class_params":
                class_params.append(param_name)
                param_name = ""

            if c == "$" and state == "class_value":
                style_type += 1

            if c == ":" and state == "in_class":
                state = "class_value"

            if state == "class_value":
                if c == "." or c == "'" or c == "(" or c == ")" or c == ",":
                    style_value += c
            elif state == "var_value":
                if c == "." or c == "'" or c == "(" or c == ")" or c == ",":
                    var_value += c
