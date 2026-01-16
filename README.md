# Procedural Fireball

https://github.com/user-attachments/assets/acae3495-ba47-42fe-8359-c7b880e8fd65
## [Interactive demo link](http://rf1424.github.io/procedural-fireball/)

My vertex shader utilizes two layers of value noise to 
generate the bumpy surface at the fire's tip. 
It also insets the tip and applies a wiggly displacement using an oscillating function.

My fragment shader implements fractional Brownian motion (fbm). 
I pass my UV coordinates and time, into this fbm function 
and discard pixels below a specified threshold. 
I also take the length of the noise-distorted position, and use to sample a color from iq's cosine gradient function.
I have some presets of these gradients which the user
can toggle using gradientType from the gui.
I make use of toolbox functions (cubic smoothstep, bias, gain, sin/cos gradient, ETC.) to remap values.

To add bloom, I set up multiple framebuffers in TypeScript: one to render the fireball, another to extract the brightest regions, and a final pass to blur and composite them for a multi-pass lighting effect.





