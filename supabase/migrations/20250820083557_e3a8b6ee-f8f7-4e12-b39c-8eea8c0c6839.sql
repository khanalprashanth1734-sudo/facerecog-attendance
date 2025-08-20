-- Insert admin profile for the existing user
INSERT INTO public.profiles (user_id, email, role)
VALUES ('5abb00eb-57d9-47a6-b39e-bfd13382da2c', 'khanalprashanth1734@gmail.com', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';