// Admin Dashboard JavaScript

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    clearLegacyData();
    loadSystemStatus();
    loadOwnerEmail();
    setupDragAndDrop();
});

function clearLegacyData() {
    // Check if there's old data with womanType field (legacy structure)
    const surveys = JSON.parse(localStorage.getItem('surveys') || '[]');
    if (surveys.length > 0 && surveys[0].womanType !== undefined) {
        console.log('🗑️ 古いデータ構造を検出しました。すべてのデータをクリアします...');
        localStorage.removeItem('hairdressers');
        localStorage.removeItem('surveys');
        localStorage.removeItem('images');
        alert('⚠️ 古いデータ構造が検出されたため、すべてのデータをクリアしました。\n新しいCSVファイルをアップロードしてください。');
        location.reload();
    }
}

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

function refreshData() {
    location.reload();
}

function confirmReset() {
    if (confirm('⚠️ 警告\n\nすべてのデータ（美容師情報、アンケート、画像、オーナー設定）を削除しますか？\n\nこの操作は取り消せません。')) {
        localStorage.clear();
        alert('✅ すべてのデータをリセットしました');
        location.reload();
    }
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

    // Load detailed data lists
    loadHairdresserList();
    loadImageList();
    loadSurveyList();
}

function loadHairdresserList() {
    const hairdressers = JSON.parse(localStorage.getItem('hairdressers') || '[]');
    const listEl = document.getElementById('hairdresser-list');

    if (hairdressers.length === 0) {
        listEl.innerHTML = '<p style="color: #999; padding: 20px; text-align: center;">データがアップロードされていません</p>';
        return;
    }

    listEl.innerHTML = hairdressers.map((h, i) => `
        <div style="padding: 16px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <div style="font-weight: 600; color: #333; margin-bottom: 4px;">${i + 1}. ${h.name || '名前なし'}</div>
                <div style="font-size: 13px; color: #666; margin-bottom: 2px;">📧 ${h.email || 'メールなし'}</div>
                <div style="font-size: 13px; color: #666; margin-bottom: 2px;">🏢 ${h.salon || 'サロン名なし'}</div>
                <div style="font-size: 13px; color: #666;">🎯 ターゲット年齢: ${h.targetAge || '未設定'}</div>
            </div>
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 8px 16px; border-radius: 8px; font-size: 12px;">
                画像: ${h.imageFile || 'なし'}
            </div>
        </div>
    `).join('');
}

function loadImageList() {
    const images = JSON.parse(localStorage.getItem('images') || '{}');
    const listEl = document.getElementById('image-list');
    const imageKeys = Object.keys(images);

    if (imageKeys.length === 0) {
        listEl.innerHTML = '<p style="color: #999; padding: 20px; text-align: center; grid-column: 1/-1;">画像がアップロードされていません</p>';
        return;
    }

    listEl.innerHTML = imageKeys.map(key => `
        <div style="border: 2px solid #e0e0e0; border-radius: 8px; overflow: hidden; background: white;">
            <img src="${images[key]}" alt="${key}" style="width: 100%; height: 120px; object-fit: cover;">
            <div style="padding: 8px; font-size: 11px; color: #666; text-align: center; border-top: 1px solid #e0e0e0;">
                ${key}
            </div>
        </div>
    `).join('');
}

function loadSurveyList() {
    const surveys = JSON.parse(localStorage.getItem('surveys') || '[]');
    const listEl = document.getElementById('survey-list');

    if (surveys.length === 0) {
        listEl.innerHTML = '<p style="color: #999; padding: 20px; text-align: center;">データがアップロードされていません</p>';
        return;
    }

    // Show latest 10 surveys
    const latestSurveys = surveys.slice(0, 10);

    listEl.innerHTML = latestSurveys.map((s, i) => `
        <div style="padding: 16px; border-bottom: 1px solid #f0f0f0;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span style="font-weight: 600; color: #667eea;">🖼️ ${s.imageFile || '画像なし'}</span>
                <span style="font-size: 12px; color: #999;">#${i + 1}</span>
            </div>
            <div style="display: flex; gap: 12px; flex-wrap: wrap; font-size: 13px; color: #666;">
                <span>📍 ${s.prefecture || '-'}</span>
                <span>👤 ${s.age || '-'}歳 ${s.gender || '-'}</span>
                <span>👶 ${s.hasChildren || '-'}</span>
                <span>💼 ${s.occupation || '-'}</span>
                <span>👩 ${s.womanType || '-'}</span>
                <span>💍 ${s.maritalStatus || '-'}</span>
            </div>
        </div>
    `).join('');
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
        skipEmptyLines: true,
        complete: (results) => {
            try {
                console.log('📊 Survey CSV Headers:', results.meta.fields);
                console.log('📊 Sample Row:', results.data[0]);

                const surveys = results.data
                    .filter(row => row.画像ファイル名 || row.imageFile)
                    .map(row => ({
                        age: row.年齢 || row.age || '',
                        prefecture: row.都道府県 || row.prefecture || '',
                        gender: row.性別 || row.gender || '',
                        maritalStatus: row.結婚 || row.marital_status || row.結婚状態 || '',
                        occupation: row.職業 || row.occupation || '',
                        hasChildren: row.子供有無 || row.has_children || row.子供の有無 || '',
                        imageFile: row.画像ファイル名 || row.imageFile || row.選択した画像ファイル || ''
                    }));

                if (surveys.length === 0) {
                    showMessage('survey-success', 'データが見つかりませんでした', false);
                    return;
                }

                console.log(`✅ ${surveys.length}件のアンケートデータを解析しました`);
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

// Smart column mapping for flexible header names
function findColumn(row, possibleNames) {
    for (const name of possibleNames) {
        if (row[name] !== undefined && row[name] !== '') {
            return row[name];
        }
    }
    return '';
}

function detectColumnMapping(headers, expectedFields) {
    const mapping = {};
    expectedFields.forEach(field => {
        const foundHeader = headers.find(h =>
            field.aliases.some(alias =>
                h.toLowerCase().includes(alias.toLowerCase()) ||
                alias.toLowerCase().includes(h.toLowerCase())
            )
        );
        mapping[field.name] = foundHeader || null;
    });
    return mapping;
}

// Preview hairdresser data in table format
let parsedHairdresserData = null;
let hairdresserColumnMapping = {};

function previewHairdresserData() {
    const textarea = document.getElementById('hairdresser-data');
    const data = textarea.value.trim();
    const previewDiv = document.getElementById('hairdresser-preview');

    if (!data) {
        previewDiv.style.display = 'none';
        return;
    }

    Papa.parse(data, {
        header: true,
        delimiter: '\t',
        skipEmptyLines: true,
        complete: (results) => {
            // Try comma if tab fails
            if (!results.meta.fields || results.meta.fields.length < 5) {
                Papa.parse(data, {
                    header: true,
                    delimiter: ',',
                    skipEmptyLines: true,
                    complete: (retryResults) => {
                        displayHairdresserPreview(retryResults);
                    }
                });
            } else {
                displayHairdresserPreview(results);
            }
        }
    });
}

function displayHairdresserPreview(results) {
    parsedHairdresserData = results;
    const table = document.getElementById('hairdresser-preview-table');
    const previewDiv = document.getElementById('hairdresser-preview');
    const countSpan = document.getElementById('hairdresser-count-preview');

    // Define expected fields with aliases
    const expectedFields = [
        { name: '氏名', aliases: ['氏名', '名前', 'name', '姓名', 'なまえ', 'ネーム'] },
        { name: 'サロン名', aliases: ['サロン名', '店名', 'salon', 'サロン', 'shop', 'store', '店舗名'] },
        { name: 'メールアドレス', aliases: ['メールアドレス', 'メール', 'email', 'mail', 'e-mail', 'アドレス'] },
        { name: 'ターゲット年齢', aliases: ['ターゲット年齢', 'ターゲット', 'target_age', 'target', '年齢層', '対象年齢'] },
        { name: '画像ファイル名', aliases: ['画像ファイル名', '画像', 'image_file', 'imageFile', 'ファイル名', 'file', 'filename', '画像名'] }
    ];

    // Detect column mapping
    const headers = results.meta.fields || Object.keys(results.data[0] || {});
    const mapping = detectColumnMapping(headers, expectedFields);

    // Initialize manual mapping if not set
    if (Object.keys(hairdresserColumnMapping).length === 0) {
        expectedFields.forEach(field => {
            hairdresserColumnMapping[field.name] = mapping[field.name] || '';
        });
    }

    // Display manual mapping editor
    let mappingHtml = '<div style="background: #fff3cd; padding: 16px; border-radius: 8px; margin-bottom: 16px; border: 2px solid #ffc107;">';
    mappingHtml += '<div style="font-weight: bold; margin-bottom: 12px; color: #856404;">⚙️ 列のマッピング設定（手動調整可能）</div>';
    mappingHtml += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 12px;">';

    expectedFields.forEach(field => {
        mappingHtml += '<div style="display: flex; align-items: center; gap: 8px;">';
        mappingHtml += `<span style="font-weight: 500; min-width: 120px;">${field.name}:</span>`;
        mappingHtml += `<select id="mapping-hairdresser-${field.name}" onchange="updateHairdresserMapping('${field.name}', this.value)" style="flex: 1; padding: 6px; border: 1px solid #ccc; border-radius: 4px;">`;
        mappingHtml += '<option value="">-- 選択してください --</option>';
        headers.forEach(h => {
            const selected = hairdresserColumnMapping[field.name] === h ? 'selected' : '';
            mappingHtml += `<option value="${h}" ${selected}>${h}</option>`;
        });
        mappingHtml += '</select>';
        mappingHtml += '</div>';
    });

    mappingHtml += '</div>';
    mappingHtml += '<button onclick="applyHairdresserMapping()" style="margin-top: 12px; padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">✓ マッピングを適用してプレビュー更新</button>';
    mappingHtml += '</div>';

    const headers_display = ['氏名', 'サロン名', 'メールアドレス', 'ターゲット年齢', '画像ファイル名'];

    let html = mappingHtml;
    html += '<table style="width: 100%; border-collapse: collapse; background: white; font-size: 13px;">';
    html += '<thead><tr>';
    headers_display.forEach(h => {
        html += `<th style="padding: 12px; background: #667eea; color: white; text-align: left; border-bottom: 2px solid #fff; white-space: nowrap;">${h}</th>`;
    });
    html += '</tr></thead><tbody>';

    results.data.forEach((row, i) => {
        const bgColor = i % 2 === 0 ? '#f8f9fa' : '#ffffff';
        html += `<tr style="background: ${bgColor};">`;
        html += `<td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${row[hairdresserColumnMapping['氏名']] || findColumn(row, ['氏名', '名前', 'name', '姓名']) || '-'}</td>`;
        html += `<td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${row[hairdresserColumnMapping['サロン名']] || findColumn(row, ['サロン名', '店名', 'salon', 'サロン', 'shop', 'store', '店舗名']) || '-'}</td>`;
        html += `<td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${row[hairdresserColumnMapping['メールアドレス']] || findColumn(row, ['メールアドレス', 'メール', 'email', 'mail', 'e-mail']) || '-'}</td>`;
        html += `<td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${row[hairdresserColumnMapping['ターゲット年齢']] || findColumn(row, ['ターゲット年齢', 'ターゲット', 'target_age', 'target', '年齢層']) || '-'}</td>`;
        html += `<td style="padding: 10px; border-bottom: 1px solid #e0e0e0; font-family: monospace; font-size: 12px;">${row[hairdresserColumnMapping['画像ファイル名']] || findColumn(row, ['画像ファイル名', '画像', 'image_file', 'imageFile', 'ファイル名', 'file']) || '-'}</td>`;
        html += '</tr>';
    });

    html += '</tbody></table>';
    table.innerHTML = html;
    countSpan.textContent = results.data.length;
    previewDiv.style.display = 'block';
}

function updateHairdresserMapping(field, column) {
    hairdresserColumnMapping[field] = column;
}

function applyHairdresserMapping() {
    // Re-render preview with updated mapping
    displayHairdresserPreview(parsedHairdresserData);
}

function confirmHairdresserData() {
    if (!parsedHairdresserData) {
        showMessage('hairdresser-success', 'データが見つかりません', false);
        return;
    }
    processHairdresserData(parsedHairdresserData);
}

function processHairdresserData(results) {
    const hairdressers = results.data
        .filter(row => findColumn(row, ['メールアドレス', 'メール', 'email', 'mail']))
        .map(row => ({
            name: findColumn(row, ['氏名', '名前', 'name', '姓名']),
            salon: findColumn(row, ['サロン名', '店名', 'salon', 'サロン', 'shop', 'store']),
            email: findColumn(row, ['メールアドレス', 'メール', 'email', 'mail', 'e-mail']),
            targetAge: findColumn(row, ['ターゲット年齢', 'ターゲット', 'target_age', 'target', '年齢層']),
            imageFile: findColumn(row, ['画像ファイル名', '画像', 'image_file', 'imageFile', 'ファイル名', 'file'])
        }));

    if (hairdressers.length === 0) {
        showMessage('hairdresser-success', 'データが見つかりませんでした。列順を確認してください', false);
        return;
    }

    console.log(`✅ ${hairdressers.length}件の美容師データを解析しました`);
    localStorage.setItem('hairdressers', JSON.stringify(hairdressers));
    showMessage('hairdresser-success', `${hairdressers.length}件の美容師データを登録しました`, true);
    loadSystemStatus();
}

// Preview survey data in table format
let parsedSurveyData = null;
let surveyColumnMapping = {};

function previewSurveyData() {
    const textarea = document.getElementById('survey-data');
    const data = textarea.value.trim();
    const previewDiv = document.getElementById('survey-preview');

    if (!data) {
        previewDiv.style.display = 'none';
        return;
    }

    Papa.parse(data, {
        header: true,
        delimiter: '\t',
        skipEmptyLines: true,
        complete: (results) => {
            // Try comma if tab fails
            if (!results.meta.fields || results.meta.fields.length < 7) {
                Papa.parse(data, {
                    header: true,
                    delimiter: ',',
                    skipEmptyLines: true,
                    complete: (retryResults) => {
                        displaySurveyPreview(retryResults);
                    }
                });
            } else {
                displaySurveyPreview(results);
            }
        }
    });
}

function displaySurveyPreview(results) {
    parsedSurveyData = results;
    const table = document.getElementById('survey-preview-table');
    const previewDiv = document.getElementById('survey-preview');
    const countSpan = document.getElementById('survey-count-preview');

    // Define expected fields with aliases
    const expectedFields = [
        { name: '年齢', aliases: ['年齢', 'age', 'ねんれい', 'エイジ', '歳'] },
        { name: '都道府県', aliases: ['都道府県', '県', 'prefecture', '住所', '地域', '都道府', 'エリア'] },
        { name: '性別', aliases: ['性別', 'gender', 'sex', '男女', '性'] },
        { name: '結婚', aliases: ['結婚', '婚姻', 'marital_status', 'marital', '既婚', '未婚', '結婚状態'] },
        { name: '子供有無', aliases: ['子供有無', '子供', 'has_children', 'children', '子ども', 'こども', '子供の有無'] },
        { name: '職業', aliases: ['職業', 'occupation', 'job', '仕事', 'work'] },
        { name: '女性像', aliases: ['女性像', 'womanType', 'woman_type', 'タイプ', 'type', '女性タイプ'] },
        { name: '画像ファイル名', aliases: ['画像ファイル名', '画像', 'image_file', 'imageFile', 'ファイル名', 'file', 'filename', '画像名'] }
    ];

    // Detect column mapping
    const headers = results.meta.fields || Object.keys(results.data[0] || {});
    const mapping = detectColumnMapping(headers, expectedFields);

    // Initialize manual mapping if not set
    if (Object.keys(surveyColumnMapping).length === 0) {
        expectedFields.forEach(field => {
            surveyColumnMapping[field.name] = mapping[field.name] || '';
        });
    }

    // Display manual mapping editor
    let mappingHtml = '<div style="background: #fff3cd; padding: 16px; border-radius: 8px; margin-bottom: 16px; border: 2px solid #ffc107;">';
    mappingHtml += '<div style="font-weight: bold; margin-bottom: 12px; color: #856404;">⚙️ 列のマッピング設定（手動調整可能）</div>';
    mappingHtml += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px;">';

    expectedFields.forEach(field => {
        mappingHtml += '<div style="display: flex; align-items: center; gap: 8px;">';
        mappingHtml += `<span style="font-weight: 500; min-width: 100px; font-size: 13px;">${field.name}:</span>`;
        mappingHtml += `<select id="mapping-survey-${field.name}" onchange="updateSurveyMapping('${field.name}', this.value)" style="flex: 1; padding: 6px; border: 1px solid #ccc; border-radius: 4px; font-size: 13px;">`;
        mappingHtml += '<option value="">-- 選択 --</option>';
        headers.forEach(h => {
            const selected = surveyColumnMapping[field.name] === h ? 'selected' : '';
            mappingHtml += `<option value="${h}" ${selected}>${h}</option>`;
        });
        mappingHtml += '</select>';
        mappingHtml += '</div>';
    });

    mappingHtml += '</div>';
    mappingHtml += '<button onclick="applySurveyMapping()" style="margin-top: 12px; padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">✓ マッピングを適用してプレビュー更新</button>';
    mappingHtml += '</div>';

    const headers_display = ['年齢', '都道府県', '性別', '結婚', '子供有無', '職業', '女性像', '画像ファイル名'];

    let html = mappingHtml;
    html += '<table style="width: 100%; border-collapse: collapse; background: white; font-size: 13px;">';
    html += '<thead><tr>';
    headers_display.forEach(h => {
        html += `<th style="padding: 12px; background: #667eea; color: white; text-align: left; border-bottom: 2px solid #fff; white-space: nowrap;">${h}</th>`;
    });
    html += '</tr></thead><tbody>';

    results.data.forEach((row, i) => {
        const bgColor = i % 2 === 0 ? '#f8f9fa' : '#ffffff';
        html += `<tr style="background: ${bgColor};">`;
        html += `<td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${row[surveyColumnMapping['年齢']] || findColumn(row, ['年齢', 'age', 'ねんれい']) || '-'}</td>`;
        html += `<td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${row[surveyColumnMapping['都道府県']] || findColumn(row, ['都道府県', '県', 'prefecture', '住所', '地域']) || '-'}</td>`;
        html += `<td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${row[surveyColumnMapping['性別']] || findColumn(row, ['性別', 'gender', 'sex', '男女']) || '-'}</td>`;
        html += `<td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${row[surveyColumnMapping['結婚']] || findColumn(row, ['結婚', '婚姻', 'marital_status', 'marital', '結婚状態']) || '-'}</td>`;
        html += `<td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${row[surveyColumnMapping['子供有無']] || findColumn(row, ['子供有無', '子供', 'has_children', 'children', '子ども']) || '-'}</td>`;
        html += `<td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${row[surveyColumnMapping['職業']] || findColumn(row, ['職業', 'occupation', 'job', '仕事']) || '-'}</td>`;
        html += `<td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${row[surveyColumnMapping['女性像']] || findColumn(row, ['女性像', 'womanType', 'woman_type', 'タイプ']) || '-'}</td>`;
        html += `<td style="padding: 10px; border-bottom: 1px solid #e0e0e0; font-family: monospace; font-size: 12px;">${row[surveyColumnMapping['画像ファイル名']] || findColumn(row, ['画像ファイル名', '画像', 'image_file', 'imageFile', 'ファイル名']) || '-'}</td>`;
        html += '</tr>';
    });

    html += '</tbody></table>';
    table.innerHTML = html;
    countSpan.textContent = results.data.length;
    previewDiv.style.display = 'block';
}

function updateSurveyMapping(field, column) {
    surveyColumnMapping[field] = column;
}

function applySurveyMapping() {
    // Re-render preview with updated mapping
    displaySurveyPreview(parsedSurveyData);
}

function confirmSurveyData() {
    if (!parsedSurveyData) {
        showMessage('survey-success', 'データが見つかりません', false);
        return;
    }
    processSurveyData(parsedSurveyData);
}

function processSurveyData(results) {
    console.log('📊 Survey Headers:', results.meta.fields);
    console.log('📊 Sample Row:', results.data[0]);

    const surveys = results.data
        .filter(row => row[surveyColumnMapping['画像ファイル名']] || findColumn(row, ['画像ファイル名', '画像', 'image_file', 'imageFile', 'ファイル名']))
        .map(row => ({
            age: row[surveyColumnMapping['年齢']] || findColumn(row, ['年齢', 'age', 'ねんれい']),
            prefecture: row[surveyColumnMapping['都道府県']] || findColumn(row, ['都道府県', '県', 'prefecture', '住所', '地域']),
            gender: row[surveyColumnMapping['性別']] || findColumn(row, ['性別', 'gender', 'sex', '男女']),
            maritalStatus: row[surveyColumnMapping['結婚']] || findColumn(row, ['結婚', '婚姻', 'marital_status', 'marital', '結婚状態']),
            hasChildren: row[surveyColumnMapping['子供有無']] || findColumn(row, ['子供有無', '子供', 'has_children', 'children', '子ども', '子供の有無']),
            occupation: row[surveyColumnMapping['職業']] || findColumn(row, ['職業', 'occupation', 'job', '仕事']),
            womanType: row[surveyColumnMapping['女性像']] || findColumn(row, ['女性像', 'womanType', 'woman_type', 'タイプ', 'type']),
            imageFile: row[surveyColumnMapping['画像ファイル名']] || findColumn(row, ['画像ファイル名', '画像', 'image_file', 'imageFile', 'ファイル名'])
        }));

    if (surveys.length === 0) {
        showMessage('survey-success', 'データが見つかりませんでした。列順を確認してください', false);
        return;
    }

    console.log(`✅ ${surveys.length}件のアンケートデータを解析しました`);
    localStorage.setItem('surveys', JSON.stringify(surveys));
    showMessage('survey-success', `${surveys.length}件のアンケートデータを登録しました`, true);
    loadSystemStatus();
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
