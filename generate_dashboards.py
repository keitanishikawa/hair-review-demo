#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import csv
import os
from collections import defaultdict

# Read hairdresser data
hairdressers = []
with open('美容師データ (1).csv', 'r', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    for row in reader:
        if row['メールアドレス']:
            hairdressers.append({
                'name': row['姓名'],
                'kana': row['セイメイ'],
                'salon': row['勤務サロン名'],
                'email': row['メールアドレス'],
                'image': row['アップロード画像ファイル名']
            })

# Read survey data and organize by image
reviews_by_image = defaultdict(list)
with open('一般女性アンケートデータ (2).csv', 'r', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    for row in reader:
        if row['選択した画像ファイル']:
            reviews_by_image[row['選択した画像ファイル']].append({
                'comment': row['コメント'],
                'occupation': row['職業'],
                'age': row['年齢'],
                'gender': row['性別']
            })

# Create dashboards directory
os.makedirs('dashboards', exist_ok=True)

# Generate individual dashboard for each hairdresser
for hairdresser in hairdressers:
    image_file = hairdresser['image']
    reviews = reviews_by_image.get(image_file, [])
    review_count = len(reviews)
    avg_rating = 4.5  # Simulated average rating
    favorites = review_count * 3  # Simulated favorites count

    # Generate HTML content
    html_content = f'''<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{hairdresser['name']} - ダッシュボード | Hair Design Review</title>
    <link rel="stylesheet" href="../css/style.css">
</head>
<body class="dashboard-page">
    <header class="header">
        <div class="header-content">
            <div class="header-logo">
                <span class="logo-text">id</span>
                <span class="logo-year">2025</span>
            </div>
            <div class="header-user">
                <span class="user-name">{hairdresser['name']}</span>
                <button class="logout-btn" onclick="logout()">ログアウト</button>
            </div>
        </div>
    </header>

    <main class="main-container">
        <div class="page-header">
            <h1 class="page-title">ダッシュボード</h1>
            <p class="page-subtitle">{hairdresser['salon']} - 投稿スタイルの分析とレビュー</p>
        </div>

        <!-- Stats Section -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-label">総レビュー数</div>
                <div class="stat-value">{review_count}</div>
                <div class="stat-change positive">
                    ↑ 12% 先月比
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-label">平均評価</div>
                <div class="stat-value">{avg_rating}</div>
                <div class="stat-change positive">
                    ↑ 0.3 先月比
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-label">お気に入り登録</div>
                <div class="stat-value">{favorites}</div>
                <div class="stat-change positive">
                    ↑ 24% 先月比
                </div>
            </div>
        </div>

        <!-- Current Design Section -->
        <section class="content-section">
            <div class="section-header">
                <h2 class="section-title">最新の投稿スタイル</h2>
            </div>

            <div class="design-card">
                <img
                    src="../images/{image_file}"
                    alt="ヘアスタイル"
                    class="design-image"
                    onerror="this.src='https://via.placeholder.com/800x600/706fd3/ffffff?text=ヘアデザイン'"
                >
                <div class="design-info">
                    <div class="design-meta">
                        <div class="design-date">投稿日: 2025年12月1日</div>
                        <span class="design-status active">レビュー受付中</span>
                    </div>

                    <div class="design-stats">
                        <div class="design-stat">
                            <div class="design-stat-value">{review_count}</div>
                            <div class="design-stat-label">レビュー数</div>
                        </div>
                        <div class="design-stat">
                            <div class="design-stat-value">{avg_rating}</div>
                            <div class="design-stat-label">平均評価</div>
                        </div>
                        <div class="design-stat">
                            <div class="design-stat-value">{favorites}</div>
                            <div class="design-stat-label">お気に入り</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Reviews Section -->
        <section class="content-section">
            <div class="section-header">
                <h2 class="section-title">最近のレビュー ({review_count}件)</h2>
            </div>

            <div class="reviews-list">
'''

    # Add reviews (up to 10 most recent)
    for i, review in enumerate(reviews[:10]):
        stars = '★' * 5  # All 5 stars for simplicity
        html_content += f'''                <div class="review-card">
                    <div class="review-header">
                        <div class="review-rating">
                            <span class="star">★</span>
                            <span class="star">★</span>
                            <span class="star">★</span>
                            <span class="star">★</span>
                            <span class="star">★</span>
                        </div>
                        <div class="review-date">{review['occupation']} ({review['age']}歳)</div>
                    </div>
                    <p class="review-text">
                        {review['comment']}
                    </p>
                </div>

'''

    html_content += f'''            </div>
        </section>

        <!-- Stylist Info Section -->
        <section class="content-section">
            <div class="section-header">
                <h2 class="section-title">美容師情報</h2>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
                <div>
                    <div style="font-size: 14px; color: #5f5f79; margin-bottom: 4px;">お名前</div>
                    <div style="font-size: 16px; font-weight: 600; color: #2c2c54;">{hairdresser['name']}</div>
                </div>
                <div>
                    <div style="font-size: 14px; color: #5f5f79; margin-bottom: 4px;">フリガナ</div>
                    <div style="font-size: 16px; font-weight: 600; color: #2c2c54;">{hairdresser['kana']}</div>
                </div>
                <div>
                    <div style="font-size: 14px; color: #5f5f79; margin-bottom: 4px;">店舗名</div>
                    <div style="font-size: 16px; font-weight: 600; color: #2c2c54;">{hairdresser['salon']}</div>
                </div>
                <div>
                    <div style="font-size: 14px; color: #5f5f79; margin-bottom: 4px;">メールアドレス</div>
                    <div style="font-size: 16px; font-weight: 600; color: #2c2c54;">{hairdresser['email']}</div>
                </div>
            </div>
        </section>
    </main>

    <script src="../js/dashboard.js"></script>
</body>
</html>
'''

    # Write to file (use email prefix as filename)
    filename = hairdresser['email'].split('@')[0].replace('.', '_')
    with open(f'dashboards/{filename}.html', 'w', encoding='utf-8') as f:
        f.write(html_content)

    print(f"Generated: dashboards/{filename}.html for {hairdresser['name']}")

print(f"\nGenerated {len(hairdressers)} hairdresser dashboards successfully!")
