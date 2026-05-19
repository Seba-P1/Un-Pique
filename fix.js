const fs = require('fs');
let lines = fs.readFileSync('app/settings.tsx', 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('icon={Lock}')) {
        lines[i] = `                    <SettingLink tc={tc} icon={Lock} iconBg={tc.isDark ? '#3B1F5E' : '#F3E8FF'} iconColor="#9333EA" label="Cambiar contraseña" onPress={handleChangePassword} />`;
    }
    if (lines[i].includes('icon={CreditCard}')) {
        lines[i] = `                    <SettingLink tc={tc} icon={CreditCard} iconBg={tc.isDark ? '#1A3A2A' : '#DCFCE7'} iconColor={colors.success} label="Métodos de pago" onPress={() => router.push('/payment-methods' as any)} />`;
    }
}

fs.writeFileSync('app/settings.tsx', lines.join('\n'));
