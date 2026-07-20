"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signupSchema, type SignupInput } from "@/validations/auth";
import { signupAction } from "@/actions/auth";

export function SignupForm() {
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: SignupInput) => {
    setAuthError(null);
    const result = await signupAction(data);

    if (!result.success) {
      if (result.errors) {
        if (result.errors.name?.[0]) {
          setError("name", { type: "server", message: result.errors.name[0] });
        }
        if (result.errors.email?.[0]) {
          setError("email", { type: "server", message: result.errors.email[0] });
        }
        if (result.errors.password?.[0]) {
          setError("password", { type: "server", message: result.errors.password[0] });
        }
      }
      if (result.error) {
        setAuthError(result.error);
      }
      return;
    }

    router.refresh();
    router.push("/dashboard");
  };

  return (
    <div className="w-full max-w-md space-y-6 rounded-lg border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
          Create an account
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Get started with your Atlas account
        </p>
      </div>

      {authError && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800/60 dark:bg-red-900/20 dark:text-red-300"
        >
          {authError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <label
            htmlFor="name"
            className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            Full name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "name-error" : undefined}
            className={`w-full rounded-md border bg-transparent px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 dark:text-neutral-100 dark:placeholder-neutral-500 ${
              errors.name
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500"
                : "border-neutral-300 focus:border-neutral-900 focus:ring-neutral-900/20 dark:border-neutral-700 dark:focus:border-neutral-100 dark:focus:ring-neutral-100/20"
            }`}
            placeholder="Jane Doe"
            {...register("name")}
          />
          {errors.name && (
            <p id="name-error" className="text-xs text-red-600 dark:text-red-400">
              {errors.name.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            className={`w-full rounded-md border bg-transparent px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 dark:text-neutral-100 dark:placeholder-neutral-500 ${
              errors.email
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500"
                : "border-neutral-300 focus:border-neutral-900 focus:ring-neutral-900/20 dark:border-neutral-700 dark:focus:border-neutral-100 dark:focus:ring-neutral-100/20"
            }`}
            placeholder="name@example.com"
            {...register("email")}
          />
          {errors.email && (
            <p id="email-error" className="text-xs text-red-600 dark:text-red-400">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            className={`w-full rounded-md border bg-transparent px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 dark:text-neutral-100 dark:placeholder-neutral-500 ${
              errors.password
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500"
                : "border-neutral-300 focus:border-neutral-900 focus:ring-neutral-900/20 dark:border-neutral-700 dark:focus:border-neutral-100 dark:focus:ring-neutral-100/20"
            }`}
            placeholder="At least 8 characters"
            {...register("password")}
          />
          {errors.password && (
            <p id="password-error" className="text-xs text-red-600 dark:text-red-400">
              {errors.password.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 dark:focus:ring-neutral-100/20"
        >
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </form>

      <div className="text-center text-sm text-neutral-500 dark:text-neutral-400">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-neutral-900 underline underline-offset-4 hover:text-neutral-700 dark:text-neutral-100 dark:hover:text-neutral-300"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
