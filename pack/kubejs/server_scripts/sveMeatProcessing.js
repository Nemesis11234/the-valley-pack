// priority: -100
ServerEvents.recipes((event) => {
  // Actual grinder behavior is restricted by sve-butchery-compat, not these JEI recipes.
  event.remove({ id: 'butchery:beefmincerecipe' });
  event.remove({ id: 'butchery:lambmincerecipe' });
  event.remove({ id: 'farm_and_charm:mincer/minced_beef' });
  event.remove({ id: 'farm_and_charm:mincer/lamb_ham' });
  const mince = (input, output) => event.custom({
    type: 'farm_and_charm:mincer', ingredient: { item: input },
    recipe_type: 'MEAT', result: { item: output, count: 1 }
  }).id('sve:mincing/' + input.replace(':', '/'));
  // Explicit cuts exclude mince, avoiding reprocessing and multiplication loops.
  ['minecraft:beef', 'butchery:raw_rump_steak', 'butchery:raw_chuck_steak',
   'butchery:raw_sirloin_steak', 'butchery:raw_ribeye_steak', 'butchery:raw_tbone_steak'
  ].forEach((input) => mince(input, 'farm_and_charm:minced_beef'));
  ['minecraft:mutton', 'butchery:raw_lamb_shoulder', 'butchery:raw_lamb_loin',
   'butchery:raw_lamb_rib', 'butchery:raw_leg_of_lamb', 'butchery:raw_lamb_sirloin'
  ].forEach((input) => mince(input, 'butchery:raw_lamb_mince'));
  // Apply to every loaded recipe producing these meals, preserving other ingredients/yields.
  ['farm_and_charm:sausage_with_oat_patty', 'brewery:sausage'].forEach((meal) => {
    ['farm_and_charm:minced_beef', 'farmersdelight:minced_beef', 'butchery:raw_beef_mince']
      .forEach((beef) => event.replaceInput({ output: meal }, beef, 'butchery:raw_sausage'));
  });
});
