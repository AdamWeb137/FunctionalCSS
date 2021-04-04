# Functional CSS

**FCSS** is a simple javascript file that allows you to write css classes with paramaters.

For exmaple if you wanted to create a buttom class with custom background and text color you could do:
```css
  how_round = 25px;

  .button(text,background){
    color:$text;
    background-color:$background;
    padding:5px 5px 5px 5px;
    border-radius:$$how_round;
  }
```
  
This code also shows off the only other feature of fcss: **global variables**.
Global variables are represented in the style values with $$.
Class paramaters are represented with a single $ much like PHP.
  
To actually use this on an html page put this in the head after downloading fcss.js:
```html
  <script src="fcss.js"></script>
  <script>
    FCSS.load(`
      how_round = 25px;
      .button(text,background){
        color:$text;
        background-color:$background;
        padding:5px 5px 5px 5px;
        border-radius:$$how_round;
      }
    `);
  </script>
```
  
Put your FCSS code in FCSS.load to add the code to the webpage
 
Then add this to buttons in the body to make a red and yellow button:
```html
  <div fclass="button(green, red)">
  <div fclass="button(blue, yellow)">
```
    
As you can see, adding a fcss class is easy and much like adding a regular css class. Just add all your classes in the _fclass_ attribute and add the paramaters if needed.

**FCSS is only for adding classes, ids, suedo-classes, etc. are not supported**
