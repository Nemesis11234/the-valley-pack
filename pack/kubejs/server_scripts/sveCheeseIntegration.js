// priority: -100
// Keep Society's dairy progression; retain old Bitterballen items for saved worlds.
ServerEvents.recipes((event) => {
  // Fluid outputs do not reliably match item-output filters.
  event.remove({ id: 'create_bic_bit:mixing/curdled_milk' });
  [
    'unripe_cheese', 'waxed_unripe_cheese',
    'young_cheese', 'waxed_young_cheese',
    'aged_cheese', 'waxed_aged_cheese',
    'unripe_cheese_wedge', 'young_cheese_wedge', 'aged_cheese_wedge'
  ].forEach((name) => event.remove({ output: 'create_bic_bit:' + name }));
});

ServerEvents.tags('item', (event) => {
  // Both spellings occur in the pack. Use explicit pieces, never whole wheels.
  const cheeses = [
    'meadow:piece_of_cheese', 'meadow:piece_of_sheep_cheese',
    'meadow:piece_of_grain_cheese', 'meadow:piece_of_amethyst_cheese',
    'meadow:piece_of_buffalo_cheese', 'meadow:piece_of_goat_cheese',
    'meadow:piece_of_warped_cheese', 'farmlife:tribull_cheese_wedge',
    'candlelight:mozzarella'
  ];
  event.add('forge:cheese', cheeses);
  event.add('forge:cheeses', cheeses);
});
