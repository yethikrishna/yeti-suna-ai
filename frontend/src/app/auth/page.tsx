"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";
import GoogleSignIn from "@/components/GoogleSignIn";
import { FlickeringGrid } from "@/components/home/ui/flickering-grid";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useState, useEffect, useRef, Suspense } from "react";
import { useScroll } from "motion/react";
import { signIn, signUp, forgotPassword } from "./actions";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, X, CheckCircle, AlertCircle, MailCheck, Loader2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

[... rest of the file content ...]
