-- Insert sample data for testing the admin panel

-- Insert sample subscriptions
INSERT INTO public.subscriptions (name, price, billing_cycle, features) VALUES
('Seedling', 0, 'monthly', '{"features": ["Basic access", "Limited sessions"]}'),
('Forest Guardian', 9.99, 'monthly', '{"features": ["Full access", "Unlimited sessions", "Priority support"]}'),
('Jungle Master', 19.99, 'monthly', '{"features": ["All features", "Advanced analytics", "Custom integrations"]}');

-- Insert sample orders
-- Updated order status from "completed" to "paid"
INSERT INTO public.orders (customer_email, customer_name, product_name, amount, status, shipping_status) VALUES
('john.doe@example.com', 'John Doe', 'Jungle Master Subscription', 19.99, 'paid', 'delivered'),
('jane.smith@example.com', 'Jane Smith', 'Forest Guardian Subscription', 9.99, 'pending', 'processing'),
('bob.wilson@example.com', 'Bob Wilson', 'Study Materials Bundle', 29.99, 'paid', 'shipped'),
('alice.brown@example.com', 'Alice Brown', 'Jungle Master Subscription', 19.99, 'failed', 'cancelled'),
('charlie.davis@example.com', 'Charlie Davis', 'Forest Guardian Subscription', 9.99, 'paid', 'delivered');

-- Insert sample contact messages
INSERT INTO public.contact_messages (name, email, subject, message, status) VALUES
('Sarah Johnson', 'sarah.j@example.com', 'Technical Support', 'I am having trouble accessing my account. Can you help?', 'unread'),
('Mike Chen', 'mike.chen@example.com', 'Feature Request', 'Would love to see more math subjects added to the platform.', 'read'),
('Emma Wilson', 'emma.w@example.com', 'Billing Question', 'I was charged twice this month. Please check my account.', 'unread'),
('David Lee', 'david.lee@example.com', 'General Inquiry', 'What are the system requirements for using the voice tutor?', 'read'),
('Lisa Garcia', 'lisa.g@example.com', 'Bug Report', 'The flashcard feature is not working properly on mobile.', 'unread');

-- Insert sample subjects
INSERT INTO public.subjects (name, color) VALUES
('Mathematics', '#3B82F6'),
('Physics', '#EF4444'),
('Chemistry', '#10B981'),
('Biology', '#F59E0B'),
('Computer Science', '#8B5CF6'),
('English Literature', '#EC4899'),
('History', '#6B7280'),
('Psychology', '#14B8A6');

-- Insert sample stress relief chats
INSERT INTO public.stress_relief_chats (message, response, age_group) VALUES
('I am feeling overwhelmed with my studies', 'I understand that studying can feel overwhelming sometimes. Let''s break down your tasks into smaller, manageable pieces. What subject is causing you the most stress right now?', 'college'),
('I have a big test tomorrow and I am nervous', 'Test anxiety is completely normal! Try some deep breathing exercises and remember that you''ve prepared well. Focus on what you know rather than what you don''t.', 'teen'),
('I cannot focus on my homework', 'Difficulty focusing happens to everyone. Try the Pomodoro technique: study for 25 minutes, then take a 5-minute break. Make sure you''re in a quiet space without distractions.', 'teen'),
('School is too hard for me', 'Learning can be challenging, but remember that everyone learns at their own pace. You''re doing great by asking for help! What specific subject would you like to work on together?', 'primary'),
('I feel like giving up on my degree', 'Those feelings are valid, but remember why you started this journey. Every successful person has felt like giving up at some point. Let''s talk about what''s making you feel this way.', 'college');
