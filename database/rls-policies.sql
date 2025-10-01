-- Row Level Security Policies

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Households policies
CREATE POLICY "Users can view households they belong to" ON households
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM household_members
            WHERE household_id = households.id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create households" ON households
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Household creators can update their households" ON households
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Household creators can delete their households" ON households
    FOR DELETE USING (auth.uid() = created_by);

-- Household members policies
CREATE POLICY "Users can view members of households they belong to" ON household_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM household_members hm2
            WHERE hm2.household_id = household_members.household_id
            AND hm2.user_id = auth.uid()
        )
    );

CREATE POLICY "Household creators can add members" ON household_members
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM households
            WHERE id = household_id
            AND created_by = auth.uid()
        )
    );

CREATE POLICY "Users can leave households" ON household_members
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Household creators can remove members" ON household_members
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM households
            WHERE id = household_id
            AND created_by = auth.uid()
        )
    );

-- Categories policies
CREATE POLICY "Users can view categories in their households" ON categories
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM household_members
            WHERE household_id = categories.household_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create categories in their households" ON categories
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM household_members
            WHERE household_id = categories.household_id
            AND user_id = auth.uid()
        )
        AND auth.uid() = created_by
    );

CREATE POLICY "Category creators can update their categories" ON categories
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Category creators can delete their categories" ON categories
    FOR DELETE USING (auth.uid() = created_by);

-- Expenses policies
CREATE POLICY "Users can view expenses in their households" ON expenses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM household_members
            WHERE household_id = expenses.household_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create expenses in their households" ON expenses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM household_members
            WHERE household_id = expenses.household_id
            AND user_id = auth.uid()
        )
        AND auth.uid() = paid_by
    );

CREATE POLICY "Expense payers can update their expenses" ON expenses
    FOR UPDATE USING (auth.uid() = paid_by);

CREATE POLICY "Expense payers can delete their expenses" ON expenses
    FOR DELETE USING (auth.uid() = paid_by);

-- Expense splits policies
CREATE POLICY "Users can view expense splits for expenses in their households" ON expense_splits
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM expenses e
            JOIN household_members hm ON e.household_id = hm.household_id
            WHERE e.id = expense_splits.expense_id
            AND hm.user_id = auth.uid()
        )
    );

CREATE POLICY "Expense payers can create splits for their expenses" ON expense_splits
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM expenses
            WHERE id = expense_id
            AND paid_by = auth.uid()
        )
    );

CREATE POLICY "Expense payers can update splits for their expenses" ON expense_splits
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM expenses
            WHERE id = expense_id
            AND paid_by = auth.uid()
        )
    );

CREATE POLICY "Expense payers can delete splits for their expenses" ON expense_splits
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM expenses
            WHERE id = expense_id
            AND paid_by = auth.uid()
        )
    );

-- Settlements policies
CREATE POLICY "Users can view settlements in their households" ON settlements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM household_members
            WHERE household_id = settlements.household_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create settlements they are involved in" ON settlements
    FOR INSERT WITH CHECK (
        (auth.uid() = from_user OR auth.uid() = to_user)
        AND EXISTS (
            SELECT 1 FROM household_members
            WHERE household_id = settlements.household_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update settlements they created" ON settlements
    FOR UPDATE USING (auth.uid() = from_user);

CREATE POLICY "Users can delete settlements they created" ON settlements
    FOR DELETE USING (auth.uid() = from_user);