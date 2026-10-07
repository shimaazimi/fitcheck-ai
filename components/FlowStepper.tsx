import Link from "next/link";

const steps = [
  { key: "wardrobe", number: "۱", title: "کمد من", description: "لباس‌هایت را ثبت کن", href: "/wardrobe" },
  { key: "occasion", number: "۲", title: "پیشنهاد موقعیت", description: "از کمدت استایل بساز", href: "/occasion" },
  { key: "buy-check", number: "۳", title: "بررسی خرید", description: "قبل از خرید مطمئن شو", href: "/buy-check" }
] as const;

export default function FlowStepper({ active }: { active: "wardrobe" | "occasion" | "buy-check" }) {
  return (
    <section className="flowStepper" aria-label="مراحل استفاده از فیت‌چک">
      <span className="flowLabel">مسیر فیت‌چک</span>
      <div className="flowSteps">
        {steps.map((step, index) => (
          <div className="flowStepWrap" key={step.key}>
            <Link className={`flowStep ${active === step.key ? "active" : ""}`} href={step.href} aria-current={active === step.key ? "step" : undefined}>
              <b>{step.number}</b>
              <span><strong>{step.title}</strong><small>{step.description}</small></span>
            </Link>
            {index < steps.length - 1 && <i aria-hidden="true">←</i>}
          </div>
        ))}
      </div>
    </section>
  );
}
