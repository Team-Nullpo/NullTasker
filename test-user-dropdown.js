// テスト用スクリプト：ユーザードロップリストの動作確認
(async function testUserDropdown() {
    console.log('=== ユーザードロップリスト テスト開始 ===');
    
    // 1. 認証状態確認
    const authToken = localStorage.getItem('authToken');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    console.log('認証トークン:', authToken ? 'あり' : 'なし');
    console.log('ユーザー情報:', user.displayName || 'なし');
    
    if (!authToken) {
        console.error('認証トークンがありません。ログインしてください。');
        return;
    }
    
    // 2. ユーザーAPI呼び出し
    try {
        const response = await fetch('/api/users', {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('ユーザーAPIレスポンス:', data);
        
        // 3. ドロップリストの更新
        const select = document.getElementById('taskAssignee');
        if (!select) {
            console.error('担当者選択要素が見つかりません');
            return;
        }
        
        console.log('担当者選択要素:', select);
        console.log('現在のオプション数:', select.children.length);
        
        // 既存のオプションをクリア（最初のオプションは残す）
        const firstOption = select.querySelector('option[value=""]');
        select.innerHTML = '';
        if (firstOption) {
            select.appendChild(firstOption);
        }
        
        // ユーザーを追加
        data.users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.displayName;
            select.appendChild(option);
            console.log(`追加されたユーザー: ${user.displayName} (${user.id})`);
        });
        
        console.log('更新後のオプション数:', select.children.length);
        console.log('=== テスト完了：成功 ===');
        
        // 結果をアラートで表示
        alert(`ユーザードロップリストを更新しました\n${data.users.length}人のユーザーが追加されました`);
        
    } catch (error) {
        console.error('エラー:', error);
        console.log('=== テスト完了：失敗 ===');
        alert(`エラーが発生しました: ${error.message}`);
    }
})();
