# Functional CSS

**FCSS** is a simple javascript file that allows you to write css classes with paramaters.

For exmaple if you wanted to create a buttom class with custom background and text color you could do:
```css
  how_round = 25px;

  .button(text,background){
    color:$text;
    background-color:$background;
    &padding_all:5px;
    border-radius:$$how_round;
    font-family:@body[font-family];
  }
```

## Variables
  
This code also shows another feature of fcss: **global variables**.
Global variables are represented in the style values with $$.
Class paramaters are represented with a single $ much like PHP.

## Selecting other element values

Another important feature is getting values from other elements.
Often times we want to use the same style as another element.
In fcss we can do it like this:
 ```css
  .class{
    style-name:@{element-selector}[{style-name-of-element}]
  }
 ```
 You can also use @self, @parent, and @child to get the element, parent element, and first child repectively.
  
## Actual example
  
To actually use this on an html page put this in the head after downloading fcss.js:
```html
  <script src="fcss.js"></script>
  <script src="default_fcss.js"></script>
  <script>
    FCSS.load(`
      how_round = 25px;
      .button(text,background){
        color:$text;
        background-color:$background;
        &padding_all:5px;
        border-radius:$$how_round;
      }
    `);
  </script>
```
  
Put your FCSS code in FCSS.load to add the code to the webpage
 
Then add this to buttons in the body to make a red and yellow button:
```html
  <body style="font-family:Arial;">
  <div fclass="button(green, red)">
  <div fclass="button(blue, yellow)">
```
    
As you can see, adding a fcss class is easy and much like adding a regular css class. Just add all your classes in the _fclass_ attribute and add the paramaters if needed.

## Shorthands
FCSS will see a style-value as one type of variable. It is either a string, paramater, global-variable, or element value.
This means fcss cannot use shorthands.
However, you can define shorthands yourself! A few default ones are coded in the default_fcss.js file such as border, padding, margin, and transition.

Lets take a look at how they are implemented with an example:

```css
  &padding(t,r,b,l){
    padding-top:t;
    padding-right:r;
    padding-bottom:b;
    padding-left:l;
  }
  
  .button(vertical,horizonal) {
    ...
    &padding:$vertical, $horizonal, $vertical, $horizonal;
  }
  
```

As you can see **shorthands are designated with the & character**
Shorthands are defined much like classes, however, all style-values are arguments and the arguments dont use the **$** character.
Implementing them is much like a normal shorthand in css, but add & infront of the shorthand name.

**FCSS is only for adding classes, ids, suedo-classes, etc. are not supported**
