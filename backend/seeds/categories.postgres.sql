-- Seed: Default Categories
-- Category Groups
INSERT INTO category_groups (id, name, type, sort_order) VALUES (1, 'Receitas', 'revenue', 1) ON CONFLICT (id) DO NOTHING;
INSERT INTO category_groups (id, name, type, sort_order) VALUES (2, 'Investimentos', 'investment', 2) ON CONFLICT (id) DO NOTHING;
INSERT INTO category_groups (id, name, type, sort_order) VALUES (3, 'Despesas Fixas', 'expense', 3) ON CONFLICT (id) DO NOTHING;
INSERT INTO category_groups (id, name, type, sort_order) VALUES (4, 'Despesas Variáveis', 'expense', 4) ON CONFLICT (id) DO NOTHING;
INSERT INTO category_groups (id, name, type, sort_order) VALUES (5, 'Despesas Extras', 'expense', 5) ON CONFLICT (id) DO NOTHING;
INSERT INTO category_groups (id, name, type, sort_order) VALUES (6, 'Despesas Adicionais', 'expense', 6) ON CONFLICT (id) DO NOTHING;

-- Categories: Receitas (group_id = 1)
INSERT INTO categories (id, group_id, name, expense_type, sort_order, active) VALUES (1, 1, 'Salário', NULL, 1, 1) ON CONFLICT (id) DO NOTHING;
INSERT INTO categories (id, group_id, name, expense_type, sort_order, active) VALUES (2, 1, 'Freelance / Autônomo', NULL, 2, 1) ON CONFLICT (id) DO NOTHING;
INSERT INTO categories (id, group_id, name, expense_type, sort_order, active) VALUES (3, 1, 'Benefícios (VR/VA)', NULL, 3, 1) ON CONFLICT (id) DO NOTHING;
INSERT INTO categories (id, group_id, name, expense_type, sort_order, active) VALUES (4, 1, 'Outras Receitas', NULL, 4, 1) ON CONFLICT (id) DO NOTHING;

-- Categories: Investimentos (group_id = 2)
INSERT INTO categories (id, group_id, name, expense_type, sort_order, active) VALUES (5, 2, 'Renda Fixa', NULL, 1, 1) ON CONFLICT (id) DO NOTHING;
INSERT INTO categories (id, group_id, name, expense_type, sort_order, active) VALUES (6, 2, 'Ações / FIIs', NULL, 2, 1) ON CONFLICT (id) DO NOTHING;
INSERT INTO categories (id, group_id, name, expense_type, sort_order, active) VALUES (7, 2, 'Tesouro Direto', NULL, 3, 1) ON CONFLICT (id) DO NOTHING;
INSERT INTO categories (id, group_id, name, expense_type, sort_order, active) VALUES (8, 2, 'Criptomoedas', NULL, 4, 1) ON CONFLICT (id) DO NOTHING;

-- Categories: Despesas Fixas (group_id = 3)
INSERT INTO categories (id, group_id, name, expense_type, sort_order, active) VALUES (9, 3, 'Aluguel', 'fixed', 1, 1) ON CONFLICT (id) DO NOTHING;
INSERT INTO categories (id, group_id, name, expense_type, sort_order, active) VALUES (10, 3, 'Condomínio', 'fixed', 2, 1) ON CONFLICT (id) DO NOTHING;
INSERT INTO categories (id, group_id, name, expense_type, sort_order, active) VALUES (11, 3, 'Energia Elétrica', 'fixed', 3, 1) ON CONFLICT (id) DO NOTHING;
INSERT INTO categories (id, group_id, name, expense_type, sort_order, active) VALUES (12, 3, 'Água e Esgoto', 'fixed', 4, 1) ON CONFLICT (id) DO NOTHING;
INSERT INTO categories (id, group_id, name, expense_type, sort_order, active) VALUES (13, 3, 'Internet', 'fixed', 5, 1) ON CONFLICT (id) DO NOTHING;
INSERT INTO categories (id, group_id, name, expense_type, sort_order, active) VALUES (14, 3, 'Plano de Saúde', 'fixed', 6, 1) ON CONFLICT (id) DO NOTHING;
INSERT INTO categories (id, group_id, name, expense_type, sort_order, active) VALUES (15, 3, 'Seguros', 'fixed', 7, 1) ON CONFLICT (id) DO NOTHING;
INSERT INTO categories (id, group_id, name, expense_type, sort_order, active) VALUES (16, 3, 'Assinaturas / Streaming', 'fixed', 8, 1) ON CONFLICT (id) DO NOTHING;

-- Categories: Despesas Variáveis (group_id = 4)
INSERT INTO categories (id, group_id, name, expense_type, sort_order, active) VALUES (17, 4, 'Supermercado', 'variable', 1, 1) ON CONFLICT (id) DO NOTHING;
INSERT INTO categories (id, group_id, name, expense_type, sort_order, active) VALUES (18, 4, 'Transporte', 'variable', 2, 1) ON CONFLICT (id) DO NOTHING;
INSERT INTO categories (id, group_id, name, expense_type, sort_order, active) VALUES (19, 4, 'Farmácia', 'variable', 3, 1) ON CONFLICT (id) DO NOTHING;
INSERT INTO categories (id, group_id, name, expense_type, sort_order, active) VALUES (20, 4, 'Vestuário', 'variable', 4, 1) ON CONFLICT (id) DO NOTHING;
INSERT INTO categories (id, group_id, name, expense_type, sort_order, active) VALUES (21, 4, 'Educação', 'variable', 5, 1) ON CONFLICT (id) DO NOTHING;
INSERT INTO categories (id, group_id, name, expense_type, sort_order, active) VALUES (22, 4, 'Lazer', 'variable', 6, 1) ON CONFLICT (id) DO NOTHING;

-- Categories: Despesas Extras (group_id = 5)
INSERT INTO categories (id, group_id, name, expense_type, sort_order, active) VALUES (23, 5, 'Restaurante', 'extra', 1, 1) ON CONFLICT (id) DO NOTHING;
INSERT INTO categories (id, group_id, name, expense_type, sort_order, active) VALUES (24, 5, 'Ifood / Delivery', 'extra', 2, 1) ON CONFLICT (id) DO NOTHING;
INSERT INTO categories (id, group_id, name, expense_type, sort_order, active) VALUES (25, 5, 'Manutenção Doméstica', 'extra', 3, 1) ON CONFLICT (id) DO NOTHING;
INSERT INTO categories (id, group_id, name, expense_type, sort_order, active) VALUES (26, 5, 'Presentes', 'extra', 4, 1) ON CONFLICT (id) DO NOTHING;
INSERT INTO categories (id, group_id, name, expense_type, sort_order, active) VALUES (27, 5, 'Viagem', 'extra', 5, 1) ON CONFLICT (id) DO NOTHING;

-- Categories: Despesas Adicionais (group_id = 6)
INSERT INTO categories (id, group_id, name, expense_type, sort_order, active) VALUES (28, 6, 'Despesas Bancárias', 'additional', 1, 1) ON CONFLICT (id) DO NOTHING;
INSERT INTO categories (id, group_id, name, expense_type, sort_order, active) VALUES (29, 6, 'Multas / Juros', 'additional', 2, 1) ON CONFLICT (id) DO NOTHING;
INSERT INTO categories (id, group_id, name, expense_type, sort_order, active) VALUES (30, 6, 'Outras Despesas', 'additional', 3, 1) ON CONFLICT (id) DO NOTHING;
