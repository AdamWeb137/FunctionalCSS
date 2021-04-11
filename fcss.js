
class FCSSArg {
    constructor(name){
        this.name = name;
    }
}

class FCSSVariable {
    constructor(name){
        this.name = name;
    }
}

class FCSSElement {
    constructor(selector){
        this.selector = selector;
    }
}

class FCSSShorthand {
    constructor (name, args, styles){
        this.name = name;
        this.arg_names = args;
        this.styles = styles;

        FCSS.shorthands[name] = this;

    }

    get_styles_dict(args){

        if(args.length != this.arg_names.length){
            throw new Error(`Shorthand, ${this.name}, requires ${this.arg_names.length} despite ${args.length} given`);
        }

        let dict = {};
        for(let i = 0; i < args.length; i++){
            dict[this.arg_names[i]] = args[i].trim();
        }
        return dict;
    }

    get_style_value_pairs(args){
        let pairs = [];
        let styles_dict = this.get_styles_dict(args);
        for(let i = 0; i < this.styles.length; i++){
            let key = this.styles[i][0];
            let value_name = this.styles[i][1];
            pairs.push([key, styles_dict[value_name].trim()]);
        }
        return pairs;
    }

    get_classed_style_dict(dict, args, local_args=true){
        let styles_dict = this.get_styles_dict(args);
        for(let i = 0; i < this.styles.length; i++){
            let key = this.styles[i][0];
            let value_name = this.styles[i][1];
            dict[FCSS.to_camel_case(key)] = FCSS.type_to_value(styles_dict[value_name].trim(), local_args);
        }
        return dict;
    }

}

class FCSS {

    static global_variables = {};
    static classes = {};
    static shorthands = {};

    static elements_by_class = {};

    static GetFirstElement(class_name){
        return FCSS.elements_by_class[class_name][0];
    }

    static GetAllElements(class_name){
        return FCSS.elements_by_class[class_name];
    }

    constructor(name, styles, args=null){
        if(name.indexOf("(") == -1 && name.indexOf(")") == -1 && name.length > 0){
            this.styles = styles;
            FCSS.classes[name] = this;
            FCSS.elements_by_class[name] = [];
            this.args = args;
            this.name = name;
        }
    }

    apply_styles(element, params=null){
        if(FCSS.isnotnull(element)){
            for(let style_name in this.styles){

                if(!(style_name in element.fstyles_affected)){
                    element.fstyles_affected[style_name] = {
                        classes:[""],
                        values:[element.style[style_name]]
                    };
                }

                if(this.styles[style_name] instanceof FCSSArg){
                    element.style[style_name] = params[this.styles[style_name].name];
                }else if(this.styles[style_name] instanceof FCSSVariable){
                    element.style[style_name] = FCSS.global_variables[this.styles[style_name].name];
                }else if(this.styles[style_name] instanceof FCSSElement){
                    let selected_el = FCSS.GetSelected(element, this.styles[style_name].selector);
                    let selector_style_name = FCSS.GetStyleNameFromSelector(style_name, this.styles[style_name].selector);
                    element.style[style_name] = selected_el.style[selector_style_name];
                }else{
                    element.style[style_name] = this.styles[style_name];
                }

                element.fstyles_affected[style_name].classes.push(this.name);
                element.fstyles_affected[style_name].values.push(element.style[style_name]);

            }
        }
    }

    static GetSelected(element, selector){
        selector = (selector[0] == "@") ? selector.slice(1) : selector;
        selector = (selector.indexOf("[") > -1) ? selector.slice(0,selector.indexOf("[")) : selector;
        if(selector == "parent"){
            return element.parentElement;
        }else if(selector == "child"){
            return element.children[0];
        }else if(selector == "self"){
            return element;   
        }else{
            return document.querySelector(selector);
        }
    }

    static GetStyleNameFromSelector(style_name,selector){
        let split = selector.split("[");
        if(split.length > 1){
            let name = FCSS.to_camel_case(split[1].replace("]",""));
            return name;
        }else{
            return style_name;
        }
    }

    static isnotnull(v){
        return (v != null && v != undefined)
    }

    static GetGlobal(name){
        return FCSS.global_variables[name];
    }

    static SetGlobal(name, value){
        FCSS.global_variables[name] = value;
    }

    static split_comma_depth(s){
        let depth = 0;
        let args = [];
        let last_i = -1;
        for(let i = 0; i < s.length; i++){
            if((s[i] == "," || s[i] == ")") && depth == 0){
                args.push(s.slice(last_i+1,i))
                last_i = i;
            }

            if(s[i] == "("){
                depth++;
            }

            if(s[i] == ")"){
                depth = Math.max(depth-1,0);
            }

        }

        return args;

    }

    static get_class_info(class_string){
        let split = class_string.split_left_right("(");
        let class_name = split.left;
    
        if(!(class_name in FCSS.classes)){
            throw new Error(`Class, ${class_name}, does not exist`);
        }

        if(class_string.indexOf("(") == -1){

            if(FCSS.classes[class_name].args != null){
                let p_needed = FCSS.classes[class_name].args.length;
                throw new Error(`Class, ${class_name}, requires ${p_needed} paramter${(p_needed == 1) ? "" : "s"}`);
            }

            return {name:class_name, params:null};
        }
    
        let value_list = split.right;
        value_list = FCSS.split_comma_depth(value_list);

        let args_dict = {};
    
        /*remove whitespace at beggining and end and then add value of arg to arg dict*/

        if(FCSS.classes[class_name].args.length != value_list.length){
            let p_needed = FCSS.classes[class_name].args.length;
            throw new Error(`Class, ${class_name}, requires ${p_needed} paramter${(p_needed == 1) ? "" : "s"} not ${value_list.length}`);
        }

        for(let i = 0 ; i < value_list.length; i++){
            value_list[i] = value_list[i].trim();
    
            let arg_name = FCSS.classes[class_name].args[i];
            args_dict[arg_name] = value_list[i];
        }
    
        let info = {name:class_name, params:args_dict};

        return info;
    
    }

    static get_classes(applied_string){
        let depth = 0;
        let classes = [];
        let begin_index = 0;
        let on_class = false;
        for(var i = 0; i < applied_string.length; i++){
            if(applied_string[i] == " " && on_class && depth == 0){
                on_class = false;
                classes.push(applied_string.slice(begin_index,i));
                continue;
            }else if(applied_string[i] == "("){
                depth++;
            }else if(applied_string[i] == ")"){
                depth--;
            }else if(on_class == false){
                begin_index = i;
                on_class = true;
            }
        }
    
        if(on_class){
            classes.push(applied_string.slice(begin_index));
        }
    
        return classes;
    }

    static to_camel_case(hyphenated){
        while(hyphenated.indexOf("-") != -1){
            let i = hyphenated.indexOf("-");
            hyphenated = hyphenated.slice(0,i) + hyphenated[i+1].toUpperCase() + hyphenated.slice(i+2);
        }
        return hyphenated;
    }

    static type_to_value(value, local_args=true){
        if(value.length > 0){
            if(value[0] == "@"){
                return new FCSSElement(value);
            }
            let var_type = 0;
            while(value[0] == "$"){
                var_type++;
                value = value.slice(1);
            }
            if (var_type == 0){
                return value;
            }
            else if(var_type == 1){
                if(local_args){
                    return new FCSSArg(value);
                }else{
                    return new FCSSVariable(value);
                }
            }
            else if(var_type == 2){
                return new FCSSVariable(value);
            }
        }
    }

    static load(text, short_to_class=false){

        let depth = 0;
        let state = "none";

        let vars_by_state = {
            "at_global":"",
            "at_class":"",
            "in_class":"",
            "at_params":"",
            "at_style_value":"",
            "at_var_value":"",
            "at_short":"",
            "at_short_params":"",
            "in_short":"",
            "at_short_style":"",
            "class_short":"",
            "class_short_params":"",
            "meta_short":"",
            "meta_short_params":""
        };

        let add_c = function(c){
            vars_by_state[state] += c;
        }

        let clear_any_state = function(){
            for(let arg of arguments){
                vars_by_state[arg] = "";
            }
        }

        let clear_state = function(){
            clear_any_state(state);
        }

        let alpha_numer_str = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890_-";
        let alpha_plus = alpha_numer_str+"',.()@[]%*+-/#^!& ";

        let class_params = [];

        let short_params = [];
        let short_styles_values = [];

        let class_short_params = [];
        let meta_short_params = [];

        let class_dict = {};

        let comment_slashes = 0;
        let can_run = true;

        let action_by_state = {
            "*":{
                "/":function(c){
                    comment_slashes++;
                },
                "\n":function(c){
                    comment_slashes=0;
                }
            },
            "none":{
                ".":(c)=>{
                    if(depth == 0){
                        state = "at_class";
                    }
                },
                "{":function(c){
                    depth = 0;
                    if(vars_by_state["at_class"] != ""){
                        state = "in_class";
                    }else if(vars_by_state["at_short"] != ""){
                        state = "in_short";
                    }
                },
                "&":(c)=>{state = "at_short";},
                [alpha_numer_str]:function(c){
                    state = "at_global";
                    add_c(c);
                },
            },
            "at_short":{
                "(":(c)=>{state = "at_short_params";},
                [alpha_numer_str]:add_c,
            },
            "at_short_params":{
                ",":function(c){
                    short_params.push(vars_by_state[state]);
                    clear_state();
                },
                ")":function(c){
                    short_params.push(vars_by_state[state]);
                    clear_state();
                    state = "none";
                },
                [alpha_numer_str]:add_c,
            },
            "in_short":{
                ":":(c)=>{state = "at_short_style";},
                "}":function(c){
                    new FCSSShorthand(vars_by_state["at_short"], short_params, short_styles_values);

                    if(short_to_class){
                        FCSS.short_to_class(vars_by_state["at_short"], short_styles_values, short_params);
                    }

                    clear_any_state("at_short","at_short_params");

                    short_params = [];
                    short_styles_values = [];

                    state = "none";
                    depth = 0;
                },
                "&":(c)=>{state = "meta_short";},
                [alpha_numer_str]:add_c,
            },
            "meta_short":{
                [alpha_numer_str]:add_c,
                ":":(c)=>{

                    if(!(vars_by_state[state] in FCSS.shorthands)){
                        throw new Error(`Shorthand, ${vars_by_state[vars_by_state]}, does not exist`);
                    }

                    state = "meta_short_params";
                }
            },
            "meta_short_params":{
                [alpha_numer_str]:add_c,
                ",":function(c){
                    meta_short_params.push(vars_by_state[state]);
                    clear_state();
                },
                ";":function(c){

                    meta_short_params.push(vars_by_state[state]);
                    clear_state();
                    short_styles_values = short_styles_values.concat(FCSS.shorthands[vars_by_state["meta_short"]].get_style_value_pairs(meta_short_params));
                    state = "in_short";

                    clear_any_state("meta_short","meta_short_params");
                    meta_short_params = [];

                }
            },
            "at_short_style":{
                [alpha_numer_str]:add_c,
                ";":function(c){
                    short_styles_values.push([vars_by_state["in_short"],vars_by_state["at_short_style"]]);
                    clear_any_state("in_short","at_short_style");
                    state = "in_short";
                }
            },
            "at_global":{
                [alpha_numer_str]:add_c,
                "=":(c)=>{state = "at_var_value";},
            },
            "at_var_value":{
                [alpha_plus]:add_c,
                ";":function(c){
                    if(depth == 0){
                        FCSS.SetGlobal(vars_by_state["at_global"],vars_by_state["at_var_value"].trim());
                        clear_any_state("at_global","at_var_value");
                        state = "none";
                    }else{
                        add_c(c);
                    }
                },
                "(":(c)=>{depth++;},
                ")":(c)=>{depth--;},
            },
            "at_class":{
                [alpha_numer_str]:add_c,
                "(":(c)=>{state = "at_params";},
                "{":function(c){
                    if(vars_by_state["at_class"] != ""){
                        state = "in_class";
                    }
                }
            },
            "at_params":{
                [alpha_numer_str]:add_c,
                ",":function(c){
                    class_params.push(vars_by_state[state]);
                    clear_state();
                },
                ")":function(c){
                    class_params.push(vars_by_state[state]);
                    clear_state();
                    state = "none";
                },
            },
            "in_class":{
                [alpha_numer_str]:add_c,
                ":":(c)=>{state = "at_style_value";},
                "}":function(c){

                    if(vars_by_state["in_class"].length > 0 && vars_by_state["at_style_value"].length > 0){
                        class_dict[FCSS.to_camel_case(vars_by_state["in_class"])] = FCSS.type_to_value(vars_by_state["at_style_value"].trim());
                        clear_any_state("in_class","at_style_value");
                    }

                    if(class_params.length > 0){
                        new FCSS(vars_by_state["at_class"], class_dict, class_params);
                    }else{
                        new FCSS(vars_by_state["at_class"], class_dict);
                    }

                    clear_any_state("at_class","at_params");
                    class_params = [];
                    class_dict = {};
                    state = "none";
                    depth = 0;
                },
                "&":(c)=>{state = "class_short";}
            },
            "class_short":{
                [alpha_numer_str]:add_c,
                ":":(c)=>{state = "class_short_params";}
            },
            "class_short_params":{
                ",":function(c){
                    if(depth == 0){
                        class_short_params.push(vars_by_state[state]);
                        clear_state();
                        can_run = false;
                    }
                },
                ";":function(c){
                    if(depth == 0){
                        class_short_params.push(vars_by_state[state]);
                        clear_state();
                        class_dict = FCSS.shorthands[vars_by_state["class_short"]].get_classed_style_dict(class_dict, class_short_params);
                        class_short_params = [];
                        clear_any_state("class_short","class_short_params");
                        state = "in_class";
                    }else{
                        add_c(c);
                    }
                },
                "(":(c)=>{depth++;},
                ")":(c)=>{depth--;},
                [alpha_plus]:add_c,
                "$":add_c,
            },
            "at_style_value":{
                ";":function(c){ 
                    if(depth == 0){
                        class_dict[FCSS.to_camel_case(vars_by_state["in_class"])] = FCSS.type_to_value(vars_by_state["at_style_value"].trim());
                        clear_any_state("in_class","at_style_value");
                        state = "in_class";
                    }else{
                        add_c(c);
                    }
                },
                "(":(c)=>{depth++;},
                ")":(c)=>{depth--;},
                "$":add_c,
                [alpha_plus]:add_c,
            }
        };
        

        for(let i = 0; i < text.length; i++){
            let c = text[i];
            let keys = Object.keys(action_by_state[state]);

            can_run = true;

            for(let k of Object.keys(action_by_state["*"])){
                if(k == c){
                    action_by_state["*"][k](c);
                }
            }

            for(let key of keys){
                if((key == c || key.indexOf(c) > -1) && comment_slashes < 2 && can_run){
                    action_by_state[state][key](c);
                }
            }
        }

    }

    static short_to_class(name, pairs, args){
        let dict = {};
        for(let pair of pairs){
            dict[FCSS.to_camel_case(pair[0])] = new FCSSArg(pair[1]);
        }
        new FCSS(name, dict, args);
    }

    static load_from_url(url){

        /*not tested*/

        let request = new XMLHttpRequest();

        let url_split = window.location.href.split('/');
        let new_url = url_split.slice(0,url_split.length-1).join('/')+url;

        request.open('GET', new_url, true);
        request.send(null);
        request.onreadystatechange = function () {
            if (request.readyState === 4 && request.status === 200) {
                var type = request.getResponseHeader('Content-Type');
                if (type.indexOf("text") !== 1) {
                    FCSS.load(request.responseText);
                }
            }
        }
    }

}

Element.prototype.apply_fclass = function(fcss_class){

    let info = FCSS.get_class_info(fcss_class);
    let name = info.name;
    let params = info.params;

    let el = this;

    if(!el.hasOwnProperty("fclass_list")){
        el.fclass_list = new Set();
    }

    if(!el.hasOwnProperty("fstyles_affected")){
        el.fstyles_affected = {};
    }

    if(name in FCSS.classes){
        FCSS.classes[name].apply_styles(el, params);
        FCSS.elements_by_class[name].push(el);
    }else{
        FCSS.elements_by_class[name] = [el];
    }

    el.fclass_list.add(name);
    el.classList.add(name);
};

Element.prototype.apply_all_fclasses = function(){
    let el = this;
    let classes = FCSS.get_classes(el.getAttribute("fclass"));
    for(let fcss_class of classes){
        el.apply_fclass(fcss_class);
    }
}

Element.prototype.remove_fclass = function(name){
    let el = this;

    if(!el.hasOwnProperty("fclass_list")){
        el.fclass_list = new Set();
    }

    if(!el.hasOwnProperty("fstyles_affected")){
        el.fstyles_affected = {};
    }

    el.fclass_list.delete(name);
    el.classList.remove(name);

    if(name in FCSS.classes){    

        let i = FCSS.elements_by_class[name].indexOf(el);
        if(i > -1){
            FCSS.elements_by_class[name].splice(i, 1);
        }

        for(let style in el.fstyles_affected){
            let class_list = el.fstyles_affected[style].classes;
            let value_list = el.fstyles_affected[style].values;


            let class_index = class_list.indexOf(name);
            if(class_index != -1){
                class_list.splice(class_index,1);
                value_list.splice(class_index,1);

                el.style[style] = value_list[value_list.length-1];
            }

        }

    }
};


Element.prototype.apply_fstyle = function(style_name, style_value){
    let element = this;
    if(style_value instanceof FCSSVariable){
        element.style[style_name] = FCSS.global_variables[style_value.name];
    }else if(style_value instanceof FCSSElement){
        let selected_el = FCSS.GetSelected(element, style_value.selector);
        let selector_style_name = FCSS.GetStyleNameFromSelector(style_name, style_value.selector);
        element.style[style_name] = selected_el.style[selector_style_name];
    }else{
        element.style[style_name] = style_value;
    }
}

Element.prototype.apply_fstyles = function(styles_string=null){
    styles_string = styles_string ?? this.getAttribute("fstyle");
    let element = this;
    let fstyles = styles_string.split_except_depth(";");
    for(let s of fstyles){
        let split = s.split_left_right(":");
        split.right = split.right.trim();
        split.left = split.left.trim();
        let style_name = FCSS.to_camel_case(split.left).trim();

        if(split.left[0] != "&"){

            let style_value = FCSS.type_to_value(split.right, false);

            element.apply_fstyle(style_name, style_value);

        }else{
            let short_params = split.right.split_except_depth(",");

            let short_name = split.left.slice(1);

            if(!(short_name in FCSS.shorthands)){
                throw new Error(`Shorthand, ${short_name}, does not exist`);
            }


            let shorthand_style_dict = FCSS.shorthands[short_name].get_classed_style_dict({}, short_params, false);
            for(let style_name in shorthand_style_dict){
                let style_value = shorthand_style_dict[style_name];
                element.apply_fstyle(style_name, style_value);
            }

        }


    }
}

String.prototype.split_left_right = function(sub){

    let s = this;
    let left = "";
    let right = "";

    if(sub.length == 0){
        return {left:"",right:s};
    }

    for(let i = 0; i < s.length; i++){
        let curr_i = i;
        let added = 0;
        let sub_i = 0;
        while(s[curr_i+added] == sub[sub_i]){
            sub_i++;
            added++;
            if(sub_i >= sub.length){
                return {left:s.slice(0, curr_i),right:s.slice(curr_i+added)};
            }
        }
    }

    return {left:s, right:""};

};

String.prototype.split_except_depth = function(sub){
    let s = this;
    let depth = 0;

    if(sub.length == 0){
        throw new Error("substring must not be empty");
    }

    let split_arr = [];
    let last_i = -1;

    for(let i = 0; i < s.length; i++){
        let curr_i = i;
        let added = 0;
        let sub_i = 0;

        if(s[i] == "("){
            depth++;
        }

        if(s[i] == ")"){
            depth--;
        }

        while(depth == 0 && curr_i+added < s.length && sub_i < sub.length && s[curr_i+added] == sub[sub_i]){
            sub_i++;
            added++;
            if(sub_i >= sub.length){
               added--;
               split_arr.push(s.slice(last_i+1, curr_i));
               last_i = curr_i+added;
               i += added;
            }
        }

    }

    if(last_i < s.length-1){
        split_arr.push(s.slice(last_i+1, s.length));
    }

    return split_arr;

}

function load_fcss_classes(){
    let applied_els = document.querySelectorAll("[fclass]");
    for(let el of applied_els){
        el.apply_all_fclasses();
    }
}

function load_fcss_styles(){
    let applied_els = document.querySelectorAll("[fstyle]");
    for(let el of applied_els){
        el.apply_fstyles();
    }
}

window.addEventListener("load",()=>{
    load_fcss_classes();
    load_fcss_styles();
});