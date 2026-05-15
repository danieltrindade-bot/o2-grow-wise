
revoke execute on function public.has_admin_role(uuid) from public, anon;
revoke execute on function public.assign_role_on_signup() from public, anon;
grant execute on function public.has_admin_role(uuid) to authenticated;
grant execute on function public.assign_role_on_signup() to authenticated;
