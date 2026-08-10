    async function checkConnection() {
      try {
        // Правильный способ проверить, отвечает ли Supabase Auth
        const { data, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        setDbStatus('Успешно подключено к Supabase! 🚀');
      } catch (err) {
        setDbStatus('Ошибка подключения: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
