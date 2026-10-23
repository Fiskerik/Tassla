-- Persist the already-approved routine icon choices on owner-created phase checklist items.
-- Existing rows and older clients remain valid through nullable, column-scoped metadata.
begin;

alter table public.dog_checklist_custom_items
  add column icon text,
  add constraint dog_checklist_custom_items_icon_check check (
    icon is null or icon in (
      'paw', 'water-outline', 'walk-outline', 'bed-outline', 'sunny-outline',
      'leaf-outline', 'heart-outline', 'flower-outline', 'brush-outline', 'bandage-outline',
      'medkit-outline', 'restaurant-outline', 'moon-outline', 'football-outline', 'fitness-outline',
      'sparkles-outline', 'home-outline', 'school-outline', 'rose-outline', 'star-outline'
    )
  );

revoke insert (icon), update (icon) on public.dog_checklist_custom_items from public, anon;
grant insert (id, dog_id, template_id, title, completed, icon) on public.dog_checklist_custom_items to authenticated;
grant update (title, completed, icon) on public.dog_checklist_custom_items to authenticated;

commit;
