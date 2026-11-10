console.info("[DramTweaks] replaceRecipesDramTweaks.js loaded");
// Listen for the "recipes" server event.
ServerEvents.recipes((e) => {

    e.replaceInput({}, 'immersive_aircraft:sail', 'smallships:sail');
    e.replaceInput({}, 'immersive_aircraft:propeller', 'create:propeller');
    e.replaceInput({}, 'create_bic_bit:sweet_dough', 'bakery:sweet_dough');
    e.replaceInput({}, 'create:wheat_flour', 'farm_and_charm:flour');
    e.replaceInput({}, 'farmersdelight:wheat_dough', 'farm_and_charm:dough');
    
});