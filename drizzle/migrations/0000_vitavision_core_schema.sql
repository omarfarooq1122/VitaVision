-- profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  age int,
  height_cm numeric,
  weight_kg numeric,
  gender text,
  activity_level text NOT NULL DEFAULT 'moderate',
  meal_frequency int NOT NULL DEFAULT 3,
  water_target_l numeric NOT NULL DEFAULT 2,
  goal text NOT NULL DEFAULT 'healthy_eating',
  diet_preference text NOT NULL DEFAULT 'none',
  likes text[] NOT NULL DEFAULT '{}',
  dislikes text[] NOT NULL DEFAULT '{}',
  avoids text[] NOT NULL DEFAULT '{}',
  calorie_target int NOT NULL DEFAULT 2000,
  protein_target int NOT NULL DEFAULT 100,
  carb_target int NOT NULL DEFAULT 220,
  fat_target int NOT NULL DEFAULT 65,
  fiber_target int NOT NULL DEFAULT 30,
  onboarded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- allergies
CREATE TABLE public.allergies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);
CREATE INDEX allergies_user_idx ON public.allergies(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.allergies TO authenticated;
GRANT ALL ON public.allergies TO service_role;
ALTER TABLE public.allergies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own allergies" ON public.allergies FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- shared food library
CREATE TABLE public.foods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  category text NOT NULL DEFAULT 'other',
  calories_100g numeric NOT NULL,
  protein_100g numeric NOT NULL DEFAULT 0,
  carbs_100g numeric NOT NULL DEFAULT 0,
  fat_100g numeric NOT NULL DEFAULT 0,
  fiber_100g numeric NOT NULL DEFAULT 0,
  sugar_100g numeric NOT NULL DEFAULT 0,
  avg_item_weight_g numeric NOT NULL DEFAULT 100,
  serving_label text NOT NULL DEFAULT '1 item',
  allergens text[] NOT NULL DEFAULT '{}',
  diet_tags text[] NOT NULL DEFAULT '{}',
  source text NOT NULL DEFAULT 'local',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX foods_name_idx ON public.foods(lower(name));
GRANT SELECT ON public.foods TO authenticated;
GRANT SELECT ON public.foods TO anon;
GRANT ALL ON public.foods TO service_role;
ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "food library readable" ON public.foods FOR SELECT TO authenticated, anon USING (true);

-- analyses
CREATE TABLE public.food_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  image_path text,
  meal_type text NOT NULL DEFAULT 'snack',
  mode text NOT NULL DEFAULT 'ai',
  total_weight_g numeric NOT NULL DEFAULT 0,
  calories numeric NOT NULL DEFAULT 0,
  protein numeric NOT NULL DEFAULT 0,
  carbs numeric NOT NULL DEFAULT 0,
  fat numeric NOT NULL DEFAULT 0,
  fiber numeric NOT NULL DEFAULT 0,
  sugar numeric NOT NULL DEFAULT 0,
  allergy_warnings jsonb NOT NULL DEFAULT '[]'::jsonb,
  logged boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX food_analyses_user_created_idx ON public.food_analyses(user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.food_analyses TO authenticated;
GRANT ALL ON public.food_analyses TO service_role;
ALTER TABLE public.food_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own analyses" ON public.food_analyses FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- detected foods
CREATE TABLE public.detected_foods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid NOT NULL REFERENCES public.food_analyses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  food_name text NOT NULL,
  confidence numeric NOT NULL DEFAULT 0,
  quantity int NOT NULL DEFAULT 1,
  bounding_box jsonb,
  est_weight_g numeric NOT NULL DEFAULT 0,
  calories numeric NOT NULL DEFAULT 0,
  protein numeric NOT NULL DEFAULT 0,
  carbs numeric NOT NULL DEFAULT 0,
  fat numeric NOT NULL DEFAULT 0,
  fiber numeric NOT NULL DEFAULT 0,
  sugar numeric NOT NULL DEFAULT 0,
  corrected boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX detected_foods_analysis_idx ON public.detected_foods(analysis_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.detected_foods TO authenticated;
GRANT ALL ON public.detected_foods TO service_role;
ALTER TABLE public.detected_foods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own detected foods" ON public.detected_foods FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- diet recommendations
CREATE TABLE public.diet_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  day date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  meal text NOT NULL,
  title text NOT NULL,
  items text[] NOT NULL DEFAULT '{}',
  calories int NOT NULL DEFAULT 0,
  protein int NOT NULL DEFAULT 0,
  rationale text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX diet_reco_user_day_idx ON public.diet_recommendations(user_id, day DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.diet_recommendations TO authenticated;
GRANT ALL ON public.diet_recommendations TO service_role;
ALTER TABLE public.diet_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own recommendations" ON public.diet_recommendations FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- updated_at helper
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER analyses_touch BEFORE UPDATE ON public.food_analyses FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- create profile row on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;

-- seed food library
INSERT INTO public.foods (name, category, calories_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, sugar_100g, avg_item_weight_g, serving_label, allergens, diet_tags) VALUES
('apple','fruit',52,0.3,14,0.2,2.4,10.4,180,'1 medium apple','{}','{vegan,vegetarian}'),
('banana','fruit',89,1.1,23,0.3,2.6,12.2,118,'1 medium banana','{}','{vegan,vegetarian}'),
('orange','fruit',47,0.9,12,0.1,2.4,9.4,131,'1 medium orange','{}','{vegan,vegetarian}'),
('grapes','fruit',69,0.7,18,0.2,0.9,15.5,80,'1 small bunch','{}','{vegan,vegetarian}'),
('strawberry','fruit',32,0.7,7.7,0.3,2,4.9,18,'1 strawberry','{}','{vegan,vegetarian}'),
('blueberry','fruit',57,0.7,14.5,0.3,2.4,10,1.5,'1 berry','{}','{vegan,vegetarian}'),
('mango','fruit',60,0.8,15,0.4,1.6,13.7,200,'1 medium mango','{}','{vegan,vegetarian}'),
('pear','fruit',57,0.4,15,0.1,3.1,9.8,178,'1 medium pear','{}','{vegan,vegetarian}'),
('watermelon','fruit',30,0.6,7.6,0.2,0.4,6.2,280,'1 slice','{}','{vegan,vegetarian}'),
('pineapple','fruit',50,0.5,13,0.1,1.4,9.9,165,'1 cup chunks','{}','{vegan,vegetarian}'),
('avocado','fruit',160,2,8.5,14.7,6.7,0.7,150,'1 medium avocado','{}','{vegan,vegetarian}'),
('tomato','vegetable',18,0.9,3.9,0.2,1.2,2.6,123,'1 medium tomato','{}','{vegan,vegetarian}'),
('cucumber','vegetable',15,0.7,3.6,0.1,0.5,1.7,200,'1 medium cucumber','{}','{vegan,vegetarian}'),
('carrot','vegetable',41,0.9,10,0.2,2.8,4.7,61,'1 medium carrot','{}','{vegan,vegetarian}'),
('broccoli','vegetable',34,2.8,7,0.4,2.6,1.7,148,'1 cup florets','{}','{vegan,vegetarian}'),
('spinach','vegetable',23,2.9,3.6,0.4,2.2,0.4,30,'1 cup leaves','{}','{vegan,vegetarian}'),
('potato','vegetable',77,2,17,0.1,2.2,0.8,173,'1 medium potato','{}','{vegan,vegetarian}'),
('sweet potato','vegetable',86,1.6,20,0.1,3,4.2,130,'1 medium','{}','{vegan,vegetarian}'),
('onion','vegetable',40,1.1,9.3,0.1,1.7,4.2,110,'1 medium onion','{}','{vegan,vegetarian}'),
('bell pepper','vegetable',31,1,6,0.3,2.1,4.2,119,'1 medium pepper','{}','{vegan,vegetarian}'),
('cauliflower','vegetable',25,1.9,5,0.3,2,1.9,100,'1 cup florets','{}','{vegan,vegetarian}'),
('lettuce','vegetable',15,1.4,2.9,0.2,1.3,0.8,50,'1 cup shredded','{}','{vegan,vegetarian}'),
('mushroom','vegetable',22,3.1,3.3,0.3,1,2,18,'1 mushroom','{}','{vegan,vegetarian}'),
('corn','vegetable',86,3.3,19,1.4,2,3.2,90,'1 cob portion','{}','{vegan,vegetarian}'),
('peas','vegetable',81,5.4,14,0.4,5.7,5.7,80,'1/2 cup','{}','{vegan,vegetarian}'),
('rice','grain',130,2.7,28,0.3,0.4,0.1,150,'1 cup cooked','{}','{vegan,vegetarian}'),
('brown rice','grain',123,2.7,26,1,1.6,0.4,150,'1 cup cooked','{}','{vegan,vegetarian}'),
('oats','grain',389,16.9,66,6.9,10.6,0.9,40,'1/2 cup dry','{}','{vegan,vegetarian}'),
('quinoa','grain',120,4.4,21,1.9,2.8,0.9,185,'1 cup cooked','{}','{vegan,vegetarian}'),
('bread','grain',265,9,49,3.2,2.7,5,30,'1 slice','{wheat,gluten}','{vegetarian,vegan}'),
('whole wheat roti','grain',297,11,58,3.7,10,1.7,45,'1 roti','{wheat,gluten}','{vegan,vegetarian}'),
('pasta','grain',158,5.8,31,0.9,1.8,0.6,140,'1 cup cooked','{wheat,gluten,egg}','{vegetarian}'),
('lentils (dal)','legume',116,9,20,0.4,7.9,1.8,200,'1 cup cooked','{}','{vegan,vegetarian}'),
('chickpeas','legume',164,8.9,27,2.6,7.6,4.8,160,'1 cup cooked','{}','{vegan,vegetarian}'),
('kidney beans','legume',127,8.7,23,0.5,6.4,0.3,170,'1 cup cooked','{}','{vegan,vegetarian}'),
('tofu','legume',76,8,1.9,4.8,0.3,0.6,120,'1/2 block','{soy}','{vegan,vegetarian}'),
('peanut','nut',567,25.8,16,49.2,8.5,4.7,1,'1 peanut','{peanut}','{vegan,vegetarian}'),
('almond','nut',579,21.2,22,49.9,12.5,4.4,1.2,'1 almond','{"tree nuts"}','{vegan,vegetarian}'),
('walnut','nut',654,15.2,14,65.2,6.7,2.6,5,'1 walnut half','{"tree nuts"}','{vegan,vegetarian}'),
('cashew','nut',553,18.2,30,43.9,3.3,5.9,1.5,'1 cashew','{"tree nuts"}','{vegan,vegetarian}'),
('chia seeds','seed',486,16.5,42,30.7,34.4,0,15,'1 tbsp','{}','{vegan,vegetarian}'),
('pumpkin seeds','seed',559,30.2,10.7,49,6,1.4,15,'1 tbsp','{}','{vegan,vegetarian}'),
('milk','dairy',61,3.2,4.8,3.3,0,5.1,240,'1 cup','{milk}','{vegetarian}'),
('yogurt','dairy',59,10,3.6,0.4,0,3.2,170,'1 cup','{milk}','{vegetarian}'),
('paneer','dairy',265,18.3,1.2,20.8,0,1.2,100,'100 g','{milk}','{vegetarian}'),
('cheese','dairy',402,25,1.3,33,0,0.5,28,'1 slice','{milk}','{vegetarian}'),
('egg','protein',155,13,1.1,11,0,1.1,50,'1 egg','{egg}','{eggetarian,vegetarian}'),
('chicken breast','protein',165,31,0,3.6,0,0,120,'1 fillet','{}','{non_vegetarian}'),
('salmon','protein',208,20,0,13,0,0,120,'1 fillet','{fish}','{non_vegetarian}'),
('tuna','protein',132,28,0,1,0,0,100,'1 portion','{fish}','{non_vegetarian}'),
('shrimp','protein',99,24,0.2,0.3,0,0,15,'1 shrimp','{shellfish}','{non_vegetarian}'),
('olive oil','fat',884,0,0,100,0,0,14,'1 tbsp','{}','{vegan,vegetarian}'),
('hummus','legume',166,7.9,14.3,9.6,6,0.3,60,'1/4 cup','{sesame}','{vegan,vegetarian}'),
('vegetable soup','mixed',40,1.5,6.5,1,1.2,2.5,240,'1 bowl','{}','{vegan,vegetarian}'),
('green salad','mixed',33,1.4,5,1.2,1.8,2,150,'1 bowl','{}','{vegan,vegetarian}');