def generate_demo_html(business_name: str, phone: str = "") -> str:
    """
    Generates a clean, responsive HTML demo template for a business landing page with custom CTA button and styling.
    """
    clean_name = business_name.strip() if business_name else "Your Business"
    phone_display = phone if phone else "Call Us Today"
    phone_link = f"tel:{phone}" if phone else "#"

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{clean_name} - Official Site</title>
    <style>
        * {{
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }}
        body {{
            background-color: #f8fafc;
            color: #1e293b;
            line-height: 1.6;
        }}
        header {{
            background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
            color: #ffffff;
            padding: 3rem 1.5rem;
            text-align: center;
        }}
        header h1 {{
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
        }}
        header p {{
            font-size: 1.2rem;
            opacity: 0.9;
            max-width: 600px;
            margin: 0 auto 1.5rem auto;
        }}
        .cta-btn {{
            display: inline-block;
            background-color: #f59e0b;
            color: #ffffff;
            font-weight: bold;
            padding: 0.85rem 2rem;
            border-radius: 50px;
            text-decoration: none;
            font-size: 1.1rem;
            box-shadow: 0 4px 14px rgba(245, 158, 11, 0.4);
            transition: transform 0.2s ease, background-color 0.2s ease;
        }}
        .cta-btn:hover {{
            background-color: #d97706;
            transform: translateY(-2px);
        }}
        .container {{
            max-width: 1000px;
            margin: 2rem auto;
            padding: 0 1.5rem;
        }}
        .features {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 1.5rem;
            margin-top: 2rem;
        }}
        .card {{
            background: #ffffff;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            border: 1px solid #e2e8f0;
        }}
        .card h3 {{
            color: #1e3a8a;
            margin-bottom: 0.5rem;
        }}
        footer {{
            text-align: center;
            padding: 2rem 1rem;
            background-color: #0f172a;
            color: #94a3b8;
            margin-top: 3rem;
        }}
    </style>
</head>
<body>

    <header>
        <h1>Welcome to {clean_name}</h1>
        <p>Your trusted local partner delivering top-quality services and exceptional customer experience.</p>
        <a href="{phone_link}" class="cta-btn">📞 {phone_display}</a>
    </header>

    <div class="container">
        <h2 style="text-align: center; color: #0f172a;">Why Choose {clean_name}?</h2>
        <div class="features">
            <div class="card">
                <h3>⭐ Reliable Service</h3>
                <p>We pride ourselves on punctuality, professionalism, and unmatched service quality for all our clients.</p>
            </div>
            <div class="card">
                <h3>⚡ Fast Turnaround</h3>
                <p>Get quick responses and efficient turnaround times tailored to meet your urgent business needs.</p>
            </div>
            <div class="card">
                <h3>💬 Customer First</h3>
                <p>Dedicated customer support to answer your questions and ensure complete satisfaction.</p>
            </div>
        </div>
    </div>

    <footer>
        <p>&copy; {clean_name}. All rights reserved. Powered by AI Lead Hunter Demo.</p>
    </footer>

</body>
</html>
"""
    return html_content
