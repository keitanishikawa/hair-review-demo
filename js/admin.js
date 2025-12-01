// Admin Dashboard JavaScript

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadSystemStatus();
    loadOwnerEmail();
    setupDragAndDrop();
});

function checkAuth() {
    const user = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!user || user.role !== 'admin') {
        window.location.href = 'login.html';
    }
}

function logout() {
    sessionStorage.clear();
    window.location.href = 'login.html';
}

function loadSystemStatus() {
    // Load hairdresser count
    const hairdressers = JSON.parse(localStorage.getItem('hairdressers') || '[]');
    document.getElementById('hairdresser-count').textContent = hairdressers.length;

    // Load survey count
    const surveys = JSON.parse(localStorage.getItem('surveys') || '[]');
    document.getElementById('survey-count').textContent = surveys.length;

    // Load image count
    const images = JSON.parse(localStorage.getItem('images') || '{}');
    document.getElementById('image-count').textContent = Object.keys(images).length;

    // Load owner status
    const ownerEmail = localStorage.getItem('ownerEmail');
    document.getElementById('owner-status').textContent = ownerEmail ? '設定済み' : '未設定';
}

function loadOwnerEmail() {
    const ownerEmail = localStorage.getItem('ownerEmail');
    if (ownerEmail) {
        document.getElementById('owner-email-input').value = ownerEmail;
    }
}

function saveOwnerEmail() {
    const email = document.getElementById('owner-email-input').value.trim();

    if (!email) {
        showMessage('owner-config-success', 'メールアドレスを入力してください', false);
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showMessage('owner-config-success', '有効なメールアドレスを入力してください', false);
        return;
    }

    localStorage.setItem('ownerEmail', email);
    showMessage('owner-config-success', 'オーナーメールアドレスを設定しました: ' + email, true);
    loadSystemStatus();
}

function setupDragAndDrop() {
    const areas = [
        { id: 'hairdresser-upload-area', handler: (file) => handleHairdresserCSV(file) },
        { id: 'survey-upload-area', handler: (file) => handleSurveyCSV(file) },
        { id: 'image-upload-area', handler: (file) => handleImageZIP(file) }
    ];

    areas.forEach(area => {
        const element = document.getElementById(area.id);

        element.addEventListener('dragover', (e) => {
            e.preventDefault();
            element.classList.add('drag-over');
        });

        element.addEventListener('dragleave', () => {
            element.classList.remove('drag-over');
        });

        element.addEventListener('drop', (e) => {
            e.preventDefault();
            element.classList.remove('drag-over');

            if (e.dataTransfer.files.length > 0) {
                area.handler(e.dataTransfer.files[0]);
            }
        });
    });
}

function handleHairdresserCSV(file) {
    if (!file) return;

    showFileInfo('hairdresser-file-list', file);

    Papa.parse(file, {
        header: true,
        encoding: 'UTF-8',
        complete: (results) => {
            try {
                const hairdressers = results.data
                    .filter(row => row.メールアドレス || row.email)
                    .map(row => ({
                        name: row.氏名 || row.name || '',
                        salon: row.サロン名 || row.salon || '',
                        email: row.メールアドレス || row.email || '',
                        targetAge: row.ターゲット年齢 || row.target_age || '',
                        imageFile: row.画像ファイル名 || row.image_file || ''
                    }));

                if (hairdressers.length === 0) {
                    showMessage('hairdresser-success', 'データが見つかりませんでした', false);
                    return;
                }

                localStorage.setItem('hairdressers', JSON.stringify(hairdressers));
                showMessage('hairdresser-success', `${hairdressers.length}名の美容師データを登録しました`, true);
                loadSystemStatus();
            } catch (error) {
                console.error('CSV parse error:', error);
                showMessage('hairdresser-success', 'CSVの処理中にエラーが発生しました', false);
            }
        },
        error: (error) => {
            console.error('CSV error:', error);
            showMessage('hairdresser-success', 'CSVファイルの読み込みに失敗しました', false);
        }
    });
}

function handleSurveyCSV(file) {
    if (!file) return;

    showFileInfo('survey-file-list', file);

    Papa.parse(file, {
        header: true,
        encoding: 'UTF-8',
        complete: (results) => {
            try {
                const surveys = results.data
                    .filter(row => row.選択した画像ファイル || row.image_file)
                    .map(row => ({
                        imageFile: row.選択した画像ファイル || row.image_file || '',
                        occupation: row.職業 || row.occupation || '',
                        age: row.年齢 || row.age || '',
                        gender: row.性別 || row.gender || '',
                        hasChildren: row.子供の有無 || row.has_children || '',
                        maritalStatus: row.結婚状態 || row.marital_status || '',
                        womanType: row.女性像 || row.woman_type || '',
                        comment: row.コメント || row.comment || ''
                    }));

                if (surveys.length === 0) {
                    showMessage('survey-success', 'データが見つかりませんでした', false);
                    return;
                }

                localStorage.setItem('surveys', JSON.stringify(surveys));
                showMessage('survey-success', `${surveys.length}件のアンケートデータを登録しました`, true);
                loadSystemStatus();
            } catch (error) {
                console.error('CSV parse error:', error);
                showMessage('survey-success', 'CSVの処理中にエラーが発生しました', false);
            }
        },
        error: (error) => {
            console.error('CSV error:', error);
            showMessage('survey-success', 'CSVファイルの読み込みに失敗しました', false);
        }
    });
}

async function handleImageZIP(file) {
    if (!file) return;

    showFileInfo('image-file-list', file);

    try {
        const zip = await JSZip.loadAsync(file);
        const images = {};
        let imageCount = 0;

        for (const [filename, zipEntry] of Object.entries(zip.files)) {
            if (!zipEntry.dir && /\.(jpg|jpeg|png|gif|webp)$/i.test(filename)) {
                const base64 = await zipEntry.async('base64');
                const ext = filename.split('.').pop().toLowerCase();
                const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

                // Store as data URL
                images[filename.split('/').pop()] = `data:${mimeType};base64,${base64}`;
                imageCount++;
            }
        }

        if (imageCount === 0) {
            showMessage('image-success', '画像ファイルが見つかりませんでした', false);
            return;
        }

        localStorage.setItem('images', JSON.stringify(images));
        showMessage('image-success', `${imageCount}個の画像をアップロードしました`, true);
        loadSystemStatus();
    } catch (error) {
        console.error('ZIP parse error:', error);
        showMessage('image-success', 'ZIPファイルの処理中にエラーが発生しました', false);
    }
}

function showFileInfo(listId, file) {
    const list = document.getElementById(listId);
    list.innerHTML = `
        <div class="file-item">
            <div>
                <span class="file-name">📎 ${file.name}</span>
                <span class="file-size">(${formatFileSize(file.size)})</span>
            </div>
        </div>
    `;
}

function showMessage(elementId, message, isSuccess) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.style.background = isSuccess ? '#d4f4dd' : '#ffe0e0';
    element.style.color = isSuccess ? '#2ed573' : '#ff4757';
    element.classList.add('show');

    setTimeout(() => {
        element.classList.remove('show');
    }, 5000);
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}
