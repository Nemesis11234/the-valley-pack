// priority: -200
ServerEvents.recipes((event) => {
  const mince = 'farm_and_charm:minced_beef';
  const oldMince = 'butchery:raw_beef_mince';
  const patty = 'farmersdelight:minced_beef';
  // Remove both beef->two patties and beef/lamb mince->three patties, plus any
  // other recipe producing old raw beef mince. Machines are handled separately.
  event.remove({ output: patty });
  event.remove({ output: oldMince });
  // Raw mince meals use the common ingredient. Keep the FD patty's three cooking
  // recipes on the formed patty so they do not compete with cooked beef mince.
  event.replaceInput({ not: { output: 'farmersdelight:beef_patty' } }, patty, mince);
  event.replaceInput({}, oldMince, mince);
  event.shapeless(patty, [mince]).id('sve:form_beef_patty');
  // One-way recovery of existing stock; no lamb-to-beef conversion.
  event.shapeless(mince, [oldMince]).id('sve:recover_legacy_beef_mince');
  event.shapeless(mince, [patty]).id('sve:unform_beef_patty');
});
