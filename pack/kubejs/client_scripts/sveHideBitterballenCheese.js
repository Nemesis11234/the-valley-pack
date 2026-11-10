JEIEvents.hideItems((event) => {
  [
    'unripe_cheese', 'waxed_unripe_cheese',
    'young_cheese', 'waxed_young_cheese',
    'aged_cheese', 'waxed_aged_cheese',
    'unripe_cheese_wedge', 'young_cheese_wedge', 'aged_cheese_wedge',
    'curdled_milk_bucket'
  ].forEach((name) => event.hide('create_bic_bit:' + name));
});
