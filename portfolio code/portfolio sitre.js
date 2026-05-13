const canvas = document.getElementById("dots");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let mouse = {
    x: null,
    y: null,
    radius: 120
};

window.addEventListener("mousemove", function (event) {
    mouse.x = event.x;
    mouse.y = event.y;
});

class Dot {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.baseX = x;
        this.baseY = y;
        this.size = 2;
    }

    draw() {
        ctx.fillStyle = "#c5c9d3";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }

    update() {
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < mouse.radius) {
            let force = (mouse.radius - distance) / mouse.radius;
            this.x -= dx * force * 0.03;
            this.y -= dy * force * 0.03;
        } else {
            this.x += (this.baseX - this.x) * 0.05;
            this.y += (this.baseY - this.y) * 0.05;
        }
    }
}

let dots = [];

function init() {
    dots = [];
    for (let y = 0; y < canvas.height; y += 40) {
        for (let x = 0; x < canvas.width; x += 40) {
            dots.push(new Dot(x, y));
        }
    }
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    dots.forEach(dot => {
        dot.update();
        dot.draw();
    });

    requestAnimationFrame(animate);
}

init();
animate();

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    init();
});
import javax.swing.*;
import java.awt.*;

public class IdyllUI {

    public static void main(String[] args) {

        JFrame frame = new JFrame("Idyll Productions");
        frame.setSize(1200, 700);
        frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        frame.setLayout(new BorderLayout());

        // ---------- NAVBAR ----------
        JPanel navbar = new JPanel();
        navbar.setLayout(new BorderLayout());
        navbar.setBorder(BorderFactory.createEmptyBorder(10, 40, 10, 40));
        navbar.setBackground(new Color(245, 245, 245));

        JLabel logo = new JLabel("Idyll");
        logo.setFont(new Font("SansSerif", Font.BOLD, 18));

        JPanel menu = new JPanel();
        menu.setBackground(new Color(245, 245, 245));

        String[] items = { "Home", "Work", "Services", "UGC", "Films", "About"};

        for (String item : items) {
            JLabel label = new JLabel(item);
            label.setFont(new Font("SansSerif", Font.PLAIN, 14));
            label.setBorder(BorderFactory.createEmptyBorder(0, 15, 0, 15));
            menu.add(label);
        }

        JButton contact = new JButton("Contact Us");
        contact.setBackground(Color.BLACK);
        contact.setForeground(Color.WHITE);

        navbar.add(logo, BorderLayout.WEST);
        navbar.add(menu, BorderLayout.CENTER);
        navbar.add(contact, BorderLayout.EAST);

        frame.add(navbar, BorderLayout.NORTH);

        // ---------- HERO SECTION ----------
        JPanel hero = new JPanel();
        hero.setLayout(new BoxLayout(hero, BoxLayout.Y_AXIS));
        hero.setBackground(Color.WHITE);

        hero.add(Box.createVerticalStrut(60));

        JLabel badge = new JLabel("300M+ Views Driven by Strategic Editing");
        badge.setFont(new Font("SansSerif", Font.PLAIN, 14));
        badge.setAlignmentX(Component.CENTER_ALIGNMENT);
        badge.setBorder(BorderFactory.createLineBorder(Color.LIGHT_GRAY));
        badge.setOpaque(true);
        badge.setBackground(new Color(250, 250, 250));
        badge.setBorder(BorderFactory.createEmptyBorder(10, 20, 10, 20));

        hero.add(badge);

        hero.add(Box.createVerticalStrut(30));

        JLabel title = new JLabel("Idyll Productions");
        title.setFont(new Font("SansSerif", Font.BOLD, 64));
        title.setAlignmentX(Component.CENTER_ALIGNMENT);

        hero.add(title);

        hero.add(Box.createVerticalStrut(20));

        JLabel subtitle = new JLabel("High-Performance Video Editing Company");
        subtitle.setFont(new Font("SansSerif", Font.PLAIN, 26));
        subtitle.setAlignmentX(Component.CENTER_ALIGNMENT);

        hero.add(subtitle);

        JLabel subtitle2 = new JLabel("for Modern creators");
        subtitle2.setFont(new Font("SansSerif", Font.BOLD, 26));
        subtitle2.setForeground(new Color(255, 120, 100));
        subtitle2.setAlignmentX(Component.CENTER_ALIGNMENT);

        hero.add(subtitle2);

        hero.add(Box.createVerticalStrut(20));

        JLabel small = new JLabel("Edited with intent, not noise.");
        small.setFont(new Font("SansSerif", Font.PLAIN, 16));
        small.setForeground(Color.GRAY);
        small.setAlignmentX(Component.CENTER_ALIGNMENT);

        hero.add(small);

        frame.add(hero, BorderLayout.CENTER);

        frame.setVisible(true);
    }
}